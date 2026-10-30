import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../services/dataService';
import {
  StudentPoloOrder,
  PoloInventoryConfig,
  PoloColorYear,
  PoloSize,
  PoloItemChoice,
  IFRAN_CLASSES,
} from '../types';
import {
  Sun,
  Moon,
  Shirt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Phone,
  User,
  GraduationCap,
  Building2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const POLO_COLORS: {
  key: PoloColorYear;
  label: string;
  shortLabel: string;
  yearLabel: string;
  colorHex: string;
  badgeClass: string;
}[] = [
  {
    key: 'BLANC_1A',
    label: 'Polo Blanc Officiel',
    shortLabel: 'Polo Blanc',
    yearLabel: '1ère Année (B1)',
    colorHex: '#FFFFFF',
    badgeClass: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
  },
  {
    key: 'ROUGE_2A',
    label: 'Polo Rouge Officiel',
    shortLabel: 'Polo Rouge',
    yearLabel: '2e Année (B2)',
    colorHex: '#E11D48',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
  {
    key: 'BLEU_3A',
    label: 'Polo Bleu Officiel',
    shortLabel: 'Polo Bleu',
    yearLabel: '3e Année (B3)',
    colorHex: '#2563EB',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
];

const POLO_SIZES: PoloSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

const formatCurrencyDots = (val: number): string => {
  const rounded = Math.round(val || 0);
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} FCFA`;
};

const KIOSK_RESET_SECONDS = 30;

const PoloOrderKiosk: React.FC = () => {
  // Theme state: defaults to false (Light Mode) for clear daylight reading & high contrast
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('kiosk_theme') === 'dark';
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('kiosk_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Live Data State
  const [orders, setOrders] = useState<StudentPoloOrder[]>([]);
  const [inventory, setInventory] = useState<PoloInventoryConfig>(
    dataService.getDefaultPoloInventory()
  );

  // Form State
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [studentClass, setStudentClass] = useState<string>('B1 Dev');
  const [phone, setPhone] = useState('');
  const [selectedColor, setSelectedColor] = useState<PoloColorYear>('BLANC_1A');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<PoloSize, number>>({
    S: 0,
    M: 1,
    L: 0,
    XL: 0,
    XXL: 0,
    '3XL': 0,
  });
  const [notes, setNotes] = useState('');

  // UI / Kiosk State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<StudentPoloOrder | null>(null);
  const [resetCountdown, setResetCountdown] = useState<number>(KIOSK_RESET_SECONDS);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Real-time subscriptions for stock accuracy
  useEffect(() => {
    const unsubOrders = dataService.subscribeToPoloOrders((liveOrders) => {
      setOrders(liveOrders);
    });
    const unsubInv = dataService.subscribeToPoloInventory((liveInv) => {
      setInventory(liveInv);
    });

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubInv) unsubInv();
    };
  }, []);

  // Track Fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-reset timer when order is confirmed
  useEffect(() => {
    if (!confirmedOrder) return;

    setResetCountdown(KIOSK_RESET_SECONDS);
    const interval = setInterval(() => {
      setResetCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleResetForm();
          return KIOSK_RESET_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [confirmedOrder]);

  // Compute live available stock per size for current selected color
  const liveStockForColor = useMemo(() => {
    const result: Record<PoloSize, { initial: number; delivered: number; available: number }> = {
      S: { initial: 0, delivered: 0, available: 0 },
      M: { initial: 0, delivered: 0, available: 0 },
      L: { initial: 0, delivered: 0, available: 0 },
      XL: { initial: 0, delivered: 0, available: 0 },
      XXL: { initial: 0, delivered: 0, available: 0 },
      '3XL': { initial: 0, delivered: 0, available: 0 },
    };

    POLO_SIZES.forEach((sz) => {
      const initial = inventory.stock?.[selectedColor]?.[sz] ?? 0;
      let delivered = 0;
      orders.forEach((o) => {
        if (o.items && o.items.length > 0) {
          o.items.forEach((it) => {
            if (it.color === selectedColor && it.size === sz && o.deliveryStatus === 'DELIVERED') {
              delivered += it.quantity || 1;
            }
          });
        } else if (o.poloType === selectedColor && o.size === sz && o.deliveryStatus === 'DELIVERED') {
          delivered += o.quantity || 1;
        }
      });
      const available = Math.max(0, initial - delivered);
      result[sz] = { initial, delivered, available };
    });

    return result;
  }, [selectedColor, inventory, orders]);

  // Handle class change & auto-suggest color
  const handleClassChange = (newClass: string) => {
    setStudentClass(newClass);
    if (newClass.startsWith('B1')) {
      setSelectedColor('BLANC_1A');
    } else if (newClass.startsWith('B2')) {
      setSelectedColor('ROUGE_2A');
    } else if (newClass.startsWith('B3')) {
      setSelectedColor('BLEU_3A');
    }
  };

  // Adjust size quantity
  const handleQuantityDelta = (sz: PoloSize, delta: number) => {
    const current = selectedQuantities[sz] || 0;
    const nextVal = Math.max(0, current + delta);
    setSelectedQuantities((prev) => ({
      ...prev,
      [sz]: nextVal,
    }));
  };

  // Total polo count
  const totalPoloCount = useMemo(() => {
    return POLO_SIZES.reduce((sum, sz) => sum + (selectedQuantities[sz] || 0), 0);
  }, [selectedQuantities]);

  const unitPrice = inventory.unitPrice || 10000;
  const totalPrice = totalPoloCount * unitPrice;

  // Toggle Fullscreen mode on Kakémono
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Reset form for next student
  const handleResetForm = () => {
    setConfirmedOrder(null);
    setLastName('');
    setFirstName('');
    setStudentClass('B1 Dev');
    setPhone('');
    setSelectedColor('BLANC_1A');
    setSelectedQuantities({
      S: 0,
      M: 1,
      L: 0,
      XL: 0,
      XXL: 0,
      '3XL': 0,
    });
    setNotes('');
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanLastName = lastName.trim();
    const cleanFirstName = firstName.trim();

    if (!cleanLastName || !cleanFirstName) {
      setErrorMessage("Veuillez renseigner votre nom et prénom(s).");
      return;
    }

    if (totalPoloCount <= 0) {
      setErrorMessage("Veuillez sélectionner au moins 1 polo (utilisez les boutons +).");
      return;
    }

    setIsSubmitting(true);

    try {
      const items: PoloItemChoice[] = POLO_SIZES.filter(
        (sz) => (selectedQuantities[sz] || 0) > 0
      ).map((sz) => ({
        color: selectedColor,
        size: sz,
        quantity: selectedQuantities[sz],
      }));

      const primarySize: PoloSize = items[0]?.size || 'M';
      const todayIso = new Date().toISOString().split('T')[0];

      const payload: Omit<StudentPoloOrder, 'id'> = {
        lastName: cleanLastName,
        firstName: cleanFirstName,
        studentClass: studentClass.trim() || 'B1 Dev',
        phone: phone.trim() || undefined,
        poloType: selectedColor,
        size: primarySize,
        quantity: totalPoloCount,
        items,
        date: todayIso,
        paymentStatus: 'UNPAID',
        amountPaid: 0,
        totalPrice: totalPrice,
        deliveryStatus: 'PENDING_STOCK',
        notes: notes.trim()
          ? `${phone ? 'Tél: ' + phone.trim() + ' • ' : ''}${notes.trim()}`
          : phone.trim()
          ? `Tél: ${phone.trim()}`
          : '',
      };

      const updatedList = await dataService.addPoloOrder(payload);
      const created = updatedList[0];
      setConfirmedOrder(created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Erreur commande polo:", err);
      setErrorMessage("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen transition-colors duration-200 flex flex-col justify-between selection:bg-bde-rose selection:text-white ${
        isDarkMode ? 'bg-[#070b14] text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Ambient Glow Effect */}
      <div
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[140px] pointer-events-none ${
          isDarkMode ? 'bg-bde-rose/15' : 'bg-bde-rose/10'
        }`}
      />

      {/* 1080 x 1920 Kiosk Shell: Fluid on mobile, exact 9:16 terminal proportions on wide screens */}
      <div className="w-full max-w-[560px] mx-auto min-h-screen flex flex-col justify-between px-4 sm:px-6 py-4 sm:py-6 relative z-10">
        {/* Top Header / Kiosk Navigation */}
        <header
          className={`flex items-center justify-between pb-4 border-b shrink-0 gap-2 transition-colors ${
            isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <Link
            to="/"
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all active:scale-95 ${
              isDarkMode
                ? 'text-slate-300 hover:text-white bg-slate-900/80 border-slate-800'
                : 'text-slate-700 hover:text-slate-900 bg-white border-slate-200 shadow-sm'
            }`}
            title="Retour au site BDE IFRAN"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Accueil BDE</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-bde-rose to-rose-400 p-0.5 shadow-lg shadow-rose-900/30">
              <div
                className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                  isDarkMode ? 'bg-[#0d1527]' : 'bg-white'
                }`}
              >
                <Shirt size={18} className={isDarkMode ? 'text-white' : 'text-bde-rose'} />
              </div>
            </div>
            <div className="leading-tight">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-bde-rose block">
                IFRAN · Borne Tactile
              </span>
              <h1
                className={`text-sm font-black tracking-wide ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Commande de Polo
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme Toggle Button (Light by default, click for Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                isDarkMode
                  ? 'bg-slate-900/80 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
              }`}
              title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Changer le thème"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                isDarkMode
                  ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
              }`}
              title={isFullscreen ? 'Quitter le plein écran' : 'Mode Plein Écran Kiosk'}
              aria-label="Plein écran"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 py-4 space-y-4">
          {/* CONFIRMATION / SUCCESS SCREEN */}
          {confirmedOrder ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Success Badge Banner */}
              <div
                className={`p-6 rounded-3xl border text-center space-y-3 shadow-xl relative overflow-hidden transition-colors ${
                  isDarkMode
                    ? 'bg-gradient-to-b from-emerald-950/70 to-slate-900/90 border-emerald-500/40'
                    : 'bg-white border-emerald-300'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-md ${
                    isDarkMode
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 shadow-emerald-900/30'
                      : 'bg-emerald-100 border border-emerald-300 text-emerald-600'
                  }`}
                >
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      isDarkMode
                        ? 'text-emerald-400 bg-emerald-950 border-emerald-800/80'
                        : 'text-emerald-800 bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    Commande Enregistrée avec Succès !
                  </span>
                  <h2
                    className={`text-xl sm:text-2xl font-black mt-2 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Merci {confirmedOrder.firstName} !
                  </h2>
                  <p
                    className={`text-xs mt-1 max-w-sm mx-auto ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Votre commande de polo a bien été transmise en direct au système du BDE IFRAN.
                  </p>
                </div>

                {/* Ticket Reference Box */}
                <div
                  className={`p-4 rounded-2xl border text-left space-y-2 mt-4 font-mono text-xs ${
                    isDarkMode
                      ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                      Référence Commande :
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      #{confirmedOrder.id.replace('polo_', '').slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                      Étudiant :
                    </span>
                    <span
                      className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                    >
                      {confirmedOrder.lastName.toUpperCase()} {confirmedOrder.firstName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                      Classe :
                    </span>
                    <span
                      className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                    >
                      {confirmedOrder.studentClass}
                    </span>
                  </div>
                  {confirmedOrder.phone && (
                    <div className="flex items-center justify-between">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                        Téléphone :
                      </span>
                      <span
                        className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                      >
                        {confirmedOrder.phone}
                      </span>
                    </div>
                  )}
                  <div
                    className={`pt-2 border-t flex items-center justify-between text-sm ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <span className={`font-sans ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Articles :
                    </span>
                    <span
                      className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                    >
                      {confirmedOrder.items && confirmedOrder.items.length > 0
                        ? confirmedOrder.items.map((it) => `${it.quantity}× ${it.size}`).join(', ')
                        : `${confirmedOrder.quantity || 1}× ${confirmedOrder.size}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span
                      className={`font-sans font-semibold ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Total à régler :
                    </span>
                    <span className="font-black text-bde-rose text-base">
                      {formatCurrencyDots(confirmedOrder.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions Card */}
              <div
                className={`p-5 rounded-3xl border space-y-3.5 text-xs shadow-sm ${
                  isDarkMode
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`flex items-center gap-2.5 font-bold ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  <Building2 size={17} className="text-bde-rose" />
                  <span>Comment régler et récupérer votre Polo ?</span>
                </div>
                <div
                  className={`space-y-2 leading-relaxed ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      Rendez-vous au <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Bureau du BDE (RDC du campus)</strong> aux heures de permanence.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Réglez votre commande en <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Espèces</strong>, par <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Wave</strong> ou <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Orange Money</strong> en indiquant votre nom.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      Si votre taille est en stock, elle vous est <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>remise immédiatement</strong>. Sinon, elle sera prioritaire sur la prochaine commande fournisseur !
                    </div>
                  </div>
                </div>
              </div>

              {/* Kiosk Auto-Reset Countdown Bar */}
              <div
                className={`p-4 rounded-2xl border text-center space-y-2.5 shadow-sm ${
                  isDarkMode
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`flex items-center justify-between text-xs ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-500" />
                    <span>Réinitialisation automatique pour l'étudiant suivant :</span>
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {resetCountdown}s
                  </span>
                </div>

                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className="bg-gradient-to-r from-bde-rose to-rose-400 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(resetCountdown / KIOSK_RESET_SECONDS) * 100}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className={`w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <RotateCcw size={15} />
                  <span>Passer à l'étudiant suivant / Nouvelle commande</span>
                </button>
              </div>
            </div>
          ) : (
            /* ORDER FORM */
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* Introduction Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-sm transition-colors ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-slate-900 via-[#111c35] to-slate-900 border-slate-800'
                    : 'bg-gradient-to-r from-rose-50/70 via-white to-slate-50 border-rose-200/80'
                }`}
              >
                <div>
                  <h2
                    className={`text-sm font-extrabold flex items-center gap-2 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    <Sparkles size={16} className="text-bde-rose shrink-0" />
                    <span>Commandez votre Polo IFRAN 2025-2026</span>
                  </h2>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Prix officiel :{' '}
                    <strong className={isDarkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'}>
                      {formatCurrencyDots(unitPrice)}
                    </strong>{' '}
                    par polo.
                  </p>
                </div>
                <span
                  className={`text-[10px] font-extrabold text-bde-rose border px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wider ${
                    isDarkMode ? 'bg-rose-950/60 border-rose-800/80' : 'bg-rose-100 border-rose-300'
                  }`}
                >
                  Promotion
                </span>
              </div>

              {errorMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-shake ${
                    isDarkMode
                      ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <AlertTriangle size={17} className="text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: IDENTITÉ ÉTUDIANT */}
              <div
                className={`p-4 rounded-2xl border space-y-3.5 shadow-sm transition-colors ${
                  isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`flex items-center gap-2 text-xs font-bold border-b pb-2 ${
                    isDarkMode ? 'text-white border-slate-800/80' : 'text-slate-900 border-slate-200'
                  }`}
                >
                  <User size={15} className="text-bde-rose" />
                  <span>Étape 1 : Vos Informations</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Nom de famille *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: KOUASSI"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all uppercase font-medium ${
                        isDarkMode
                          ? 'border-slate-700 bg-slate-950/80 text-white placeholder-slate-500'
                          : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Prénom(s) *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Jean-Marc"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all font-medium capitalize ${
                        isDarkMode
                          ? 'border-slate-700 bg-slate-950/80 text-white placeholder-slate-500'
                          : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Classe / Filière *
                    </label>
                    <select
                      value={studentClass}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all ${
                        isDarkMode
                          ? 'border-slate-700 bg-slate-950/80 text-white'
                          : 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white'
                      }`}
                    >
                      {IFRAN_CLASSES.map((c) => (
                        <option
                          key={c}
                          value={c}
                          className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                        >
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Numéro WhatsApp / Tél. (Retrait)
                    </label>
                    <div className="relative">
                      <Phone
                        size={14}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 07 00 00 00 00"
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all ${
                          isDarkMode
                            ? 'border-slate-700 bg-slate-950/80 text-white placeholder-slate-500'
                            : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: COULEUR DU POLO */}
              <div
                className={`p-4 rounded-2xl border space-y-3 shadow-sm transition-colors ${
                  isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`flex items-center justify-between text-xs font-bold border-b pb-2 ${
                    isDarkMode ? 'text-white border-slate-800/80' : 'text-slate-900 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shirt size={15} className="text-bde-rose" />
                    <span>Étape 2 : Couleur du Polo</span>
                  </div>
                  <span
                    className={`text-[11px] font-normal ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Suggéré pour votre niveau
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {POLO_COLORS.map((cfg) => {
                    const isSelected = selectedColor === cfg.key;
                    return (
                      <button
                        key={cfg.key}
                        type="button"
                        onClick={() => setSelectedColor(cfg.key)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between relative overflow-hidden group active:scale-95 ${
                          isSelected
                            ? isDarkMode
                              ? 'border-bde-rose bg-rose-950/40 shadow-lg shadow-rose-950/50 ring-2 ring-bde-rose'
                              : 'border-bde-rose bg-rose-50/80 shadow-md ring-2 ring-bde-rose'
                            : isDarkMode
                            ? 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 text-slate-300'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`w-6 h-6 rounded-full shrink-0 border-2 shadow-md ${
                              cfg.key === 'BLANC_1A'
                                ? 'bg-white border-slate-300'
                                : cfg.key === 'ROUGE_2A'
                                ? 'bg-rose-600 border-rose-400'
                                : 'bg-blue-600 border-blue-400'
                            }`}
                          />
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-bde-rose text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        <div>
                          <div
                            className={`text-xs font-black ${
                              isSelected
                                ? isDarkMode
                                  ? 'text-white'
                                  : 'text-slate-900'
                                : isDarkMode
                                ? 'text-slate-200'
                                : 'text-slate-800'
                            }`}
                          >
                            {cfg.shortLabel}
                          </div>
                          <div
                            className={`text-[10px] font-medium mt-0.5 ${
                              isDarkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {cfg.yearLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: TAILLES ET QUANTITÉS */}
              <div
                className={`p-4 rounded-2xl border space-y-3.5 shadow-sm transition-colors ${
                  isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`flex items-center justify-between text-xs font-bold border-b pb-2 ${
                    isDarkMode ? 'text-white border-slate-800/80' : 'text-slate-900 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap size={15} className="text-bde-rose" />
                    <span>Étape 3 : Tailles & Quantités</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-bde-rose">
                    Total : {totalPoloCount} polo(s)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {POLO_SIZES.map((sz) => {
                    const count = selectedQuantities[sz] || 0;
                    const stock = liveStockForColor[sz];
                    const isAvailable = stock.available > 0;

                    return (
                      <div
                        key={sz}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                          count > 0
                            ? isDarkMode
                              ? 'border-bde-rose bg-rose-950/20 shadow-md ring-1 ring-bde-rose'
                              : 'border-bde-rose bg-rose-50/70 shadow-sm ring-1 ring-bde-rose'
                            : isDarkMode
                            ? 'border-slate-800 bg-slate-950/60'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono font-black text-sm ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            Taille {sz}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                              isAvailable
                                ? isDarkMode
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800/70'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isDarkMode
                                ? 'bg-amber-950 text-amber-400 border-amber-800/70'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isAvailable ? `${stock.available} dispo` : 'Sur commande'}
                          </span>
                        </div>

                        {/* Stepper Buttons (Touch-friendly minimum 44px) */}
                        <div
                          className={`flex items-center justify-between mt-3 pt-2 border-t ${
                            isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleQuantityDelta(sz, -1)}
                            disabled={count <= 0}
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none ${
                              isDarkMode
                                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
                                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm'
                            }`}
                            aria-label={`Diminuer taille ${sz}`}
                          >
                            <Minus size={14} />
                          </button>

                          <span
                            className={`font-mono font-black text-sm px-2 ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {count}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuantityDelta(sz, 1)}
                            className="w-8 h-8 rounded-xl bg-bde-rose hover:bg-rose-700 text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-rose-900/30"
                            aria-label={`Augmenter taille ${sz}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p
                  className={`text-[11px] leading-relaxed italic ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  💡 Vous pouvez commander plusieurs polos pour vous ou vos camarades (ex: 1 taille M et 1 taille L).
                </p>
              </div>

              {/* STEP 4: RECAP & VALIDATION */}
              <div
                className={`p-4 rounded-2xl border space-y-3 shadow-md transition-colors ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-slate-900 to-[#121c38] border-slate-800'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                    Total sélectionné :
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {totalPoloCount} polo(s)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                    Prix unitaire officiel :
                  </span>
                  <span
                    className={`font-mono ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    {formatCurrencyDots(unitPrice)}
                  </span>
                </div>

                <div
                  className={`pt-2 border-t flex items-center justify-between ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <span
                    className={`text-sm font-extrabold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Montant total à régler :
                  </span>
                  <span className="text-xl font-black text-bde-rose font-mono">
                    {formatCurrencyDots(totalPrice)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || totalPoloCount <= 0}
                  className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-bde-rose to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-rose-900/30 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Confirmer ma commande</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>

              {/* Footer Trust Note */}
              <div
                className={`text-center text-[10px] flex items-center justify-center gap-1.5 pt-1 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Plateforme sécurisée officielle · BDE IFRAN Abidjan</span>
              </div>
            </form>
          )}
        </main>

        {/* Kiosk Bottom Footer Bar */}
        <footer
          className={`pt-3 pb-1 border-t text-center text-[10px] shrink-0 transition-colors ${
            isDarkMode ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
          }`}
        >
          IFRAN BDE CONNECT • Borne Tactile 1080×1920 & Mobile
        </footer>
      </div>
    </div>
  );
};

export default PoloOrderKiosk;
