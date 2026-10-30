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
  Wallet,
  Building2,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const POLO_COLORS: {
  key: PoloColorYear;
  label: string;
  shortLabel: string;
  yearLabel: string;
  colorHex: string;
  accentClass: string;
  bgGradient: string;
  badgeClass: string;
  poloBorderClass: string;
}[] = [
  {
    key: 'BLANC_1A',
    label: 'Polo Blanc Officiel',
    shortLabel: 'Polo Blanc',
    yearLabel: '1ère Année (B1)',
    colorHex: '#FFFFFF',
    accentClass: 'text-slate-900 dark:text-white',
    bgGradient: 'from-slate-100 to-white dark:from-slate-800 dark:to-slate-900',
    badgeClass: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
    poloBorderClass: 'border-slate-300 dark:border-slate-600',
  },
  {
    key: 'ROUGE_2A',
    label: 'Polo Rouge Officiel',
    shortLabel: 'Polo Rouge',
    yearLabel: '2e Année (B2)',
    colorHex: '#E11D48',
    accentClass: 'text-rose-600 dark:text-rose-400',
    bgGradient: 'from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    poloBorderClass: 'border-rose-400 dark:border-rose-700',
  },
  {
    key: 'BLEU_3A',
    label: 'Polo Bleu Officiel',
    shortLabel: 'Polo Bleu',
    yearLabel: '3e Année (B3)',
    colorHex: '#2563EB',
    accentClass: 'text-blue-600 dark:text-blue-400',
    bgGradient: 'from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-900',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    poloBorderClass: 'border-blue-400 dark:border-blue-700',
  },
];

const POLO_SIZES: PoloSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

const formatCurrencyDots = (val: number): string => {
  const rounded = Math.round(val || 0);
  return `${rounded.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')} FCFA`;
};

const KIOSK_RESET_SECONDS = 30;

const PoloOrderKiosk: React.FC = () => {
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

  const currentColorConfig = POLO_COLORS.find((c) => c.key === selectedColor)!;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between selection:bg-bde-rose selection:text-white"
    >
      {/* Top Ambient Glow Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-bde-rose/15 rounded-full blur-[140px] pointer-events-none" />

      {/* 1080 x 1920 Kiosk Shell: Fluid on mobile, exact 9:16 terminal proportions on wide desktop */}
      <div className="w-full max-w-[560px] mx-auto min-h-screen flex flex-col justify-between px-4 sm:px-6 py-4 sm:py-6 relative z-10">
        
        {/* Top Header / Kiosk Navigation */}
        <header className="flex items-center justify-between pb-4 border-b border-slate-800/80 shrink-0 gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 active:scale-95"
            title="Retour au site BDE IFRAN"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Accueil BDE</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-bde-rose to-rose-400 p-0.5 shadow-lg shadow-rose-900/30">
              <div className="w-full h-full bg-[#0d1527] rounded-[10px] flex items-center justify-center">
                <Shirt size={18} className="text-white" />
              </div>
            </div>
            <div className="leading-tight">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-bde-rose block">
                IFRAN · Borne Tactile
              </span>
              <h1 className="text-sm font-black text-white tracking-wide">
                Commande de Polo
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95"
            title={isFullscreen ? "Quitter le plein écran" : "Mode Plein Écran Kiosk"}
            aria-label="Plein écran"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 py-4 space-y-5">
          {/* CONFIRMATION / SUCCESS SCREEN */}
          {confirmedOrder ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Success Badge Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-emerald-950/70 to-slate-900/90 border border-emerald-500/40 text-center space-y-3 shadow-2xl relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-900/30">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800/80">
                    Commande Enregistrée avec Succès !
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                    Merci {confirmedOrder.firstName} !
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                    Votre commande de polo a bien été transmise en direct au système du BDE IFRAN.
                  </p>
                </div>

                {/* Ticket Reference Box */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 mt-4 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Référence Commande :</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      #{confirmedOrder.id.replace('polo_', '').slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Étudiant :</span>
                    <span className="font-bold text-white">
                      {confirmedOrder.lastName.toUpperCase()} {confirmedOrder.firstName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Classe :</span>
                    <span className="font-bold text-slate-200">{confirmedOrder.studentClass}</span>
                  </div>
                  {confirmedOrder.phone && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Téléphone :</span>
                      <span className="font-bold text-slate-200">{confirmedOrder.phone}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                    <span className="text-slate-300 font-sans">Articles :</span>
                    <span className="font-bold text-white">
                      {confirmedOrder.items && confirmedOrder.items.length > 0
                        ? confirmedOrder.items.map((it) => `${it.quantity}× ${it.size}`).join(', ')
                        : `${confirmedOrder.quantity || 1}× ${confirmedOrder.size}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-slate-300 font-sans font-semibold">Total à régler :</span>
                    <span className="font-black text-bde-rose text-base">
                      {formatCurrencyDots(confirmedOrder.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions Card */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3.5 text-xs">
                <div className="flex items-center gap-2.5 text-slate-200 font-bold">
                  <Building2 size={17} className="text-bde-rose" />
                  <span>Comment régler et récupérer votre Polo ?</span>
                </div>
                <div className="space-y-2 text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      Rendez-vous au <strong>Bureau du BDE (RDC du campus)</strong> aux heures de permanence.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Réglez votre commande en <strong>Espèces</strong>, par <strong>Wave</strong> ou <strong>Orange Money</strong> en indiquant votre nom.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      Si votre taille est en stock, elle vous est <strong>remise immédiatement</strong>. Sinon, elle sera prioritaire sur la prochaine livraison fournisseur !
                    </div>
                  </div>
                </div>
              </div>

              {/* Kiosk Auto-Reset Countdown Bar */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-400" />
                    <span>Réinitialisation automatique pour l'étudiant suivant :</span>
                  </span>
                  <span className="font-mono font-bold text-white text-sm">
                    {resetCountdown}s
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-bde-rose to-rose-400 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(resetCountdown / KIOSK_RESET_SECONDS) * 100}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 active:scale-98 shadow-md"
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
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#111c35] to-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-md">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-bde-rose shrink-0" />
                    <span>Commandez votre Polo IFRAN 2025-2026</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Prix officiel : <strong className="text-white font-bold">{formatCurrencyDots(unitPrice)}</strong> par polo.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-bde-rose bg-rose-950/60 border border-rose-800/80 px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wider">
                  Promotion
                </span>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
                  <AlertTriangle size={17} className="text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: IDENTITÉ ÉTUDIANT */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800/80 pb-2">
                  <User size={15} className="text-bde-rose" />
                  <span>Étape 1 : Vos Informations</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nom de famille *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: KOUASSI"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all uppercase font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Prénom(s) *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Jean-Marc"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all font-medium capitalize"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Classe / Filière *
                    </label>
                    <select
                      value={studentClass}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-white text-xs font-semibold focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all"
                    >
                      {IFRAN_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Numéro WhatsApp / Tél. (Retrait)
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 07 00 00 00 00"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: COULEUR DU POLO */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Shirt size={15} className="text-bde-rose" />
                    <span>Étape 2 : Couleur du Polo</span>
                  </div>
                  <span className="text-[11px] font-normal text-slate-400">
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
                            ? 'border-bde-rose bg-rose-950/40 shadow-lg shadow-rose-950/50 ring-2 ring-bde-rose'
                            : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 text-slate-300'
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
                          <div className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {cfg.shortLabel}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {cfg.yearLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: TAILLES ET QUANTITÉS */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800/80 pb-2">
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
                            ? 'border-bde-rose bg-rose-950/20 shadow-md ring-1 ring-bde-rose'
                            : 'border-slate-800 bg-slate-950/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-sm text-white">
                            Taille {sz}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isAvailable
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/70'
                                : 'bg-amber-950 text-amber-400 border border-amber-800/70'
                            }`}
                          >
                            {isAvailable ? `${stock.available} dispo` : 'Sur commande'}
                          </span>
                        </div>

                        {/* Stepper Buttons (Touch-friendly minimum 44px) */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleQuantityDelta(sz, -1)}
                            disabled={count <= 0}
                            className="w-8 h-8 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-white active:scale-95 transition-all"
                            aria-label={`Diminuer taille ${sz}`}
                          >
                            <Minus size={14} />
                          </button>

                          <span className="font-mono font-black text-sm text-white px-2">
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

                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  💡 Vous pouvez commander plusieurs polos pour vous ou vos camarades (ex: 1 taille M et 1 taille L).
                </p>
              </div>

              {/* STEP 4: RECAP & VALIDATION */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#121c38] border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Total sélectionné :</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {totalPoloCount} polo(s)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Prix unitaire officiel :</span>
                  <span className="font-mono text-slate-300">
                    {formatCurrencyDots(unitPrice)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-white">
                    Montant total à régler :
                  </span>
                  <span className="text-xl font-black text-bde-rose font-mono">
                    {formatCurrencyDots(totalPrice)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || totalPoloCount <= 0}
                  className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-bde-rose to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
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
              <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Plateforme sécurisée officielle · BDE IFRAN Abidjan</span>
              </div>
            </form>
          )}
        </main>

        {/* Kiosk Bottom Footer Bar */}
        <footer className="pt-3 pb-1 border-t border-slate-800/80 text-center text-[10px] text-slate-500 shrink-0">
          IFRAN BDE CONNECT • Borne Tactile 1080×1920 & Mobile
        </footer>
      </div>
    </div>
  );
};

export default PoloOrderKiosk;
