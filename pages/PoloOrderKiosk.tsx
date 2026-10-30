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
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Phone,
  User,
  GraduationCap,
  Building2,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  FileCheck2,
} from 'lucide-react';

const POLO_SIZES: PoloSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

const formatCurrencyDots = (val: number): string => {
  const rounded = Math.round(val || 0);
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} FCFA`;
};

const getColorFromClass = (cls: string): PoloColorYear => {
  if (cls.startsWith('B2')) return 'ROUGE_2A';
  if (cls.startsWith('B3')) return 'BLEU_3A';
  return 'BLANC_1A';
};

const KIOSK_RESET_SECONDS = 30;

const PoloOrderKiosk: React.FC = () => {
  // Live Data State
  const [inventory, setInventory] = useState<PoloInventoryConfig>(
    dataService.getDefaultPoloInventory()
  );

  // Form State
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [studentClass, setStudentClass] = useState<string>('B1 Dev');
  const [phone, setPhone] = useState('');
  const [hasAlreadyPaid, setHasAlreadyPaid] = useState<boolean>(false);
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Real-time subscription for unit price accuracy
  useEffect(() => {
    const unsubInv = dataService.subscribeToPoloInventory((liveInv) => {
      setInventory(liveInv);
    });

    return () => {
      if (unsubInv) unsubInv();
    };
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

  // Reset form for next student
  const handleResetForm = () => {
    setConfirmedOrder(null);
    setLastName('');
    setFirstName('');
    setStudentClass('B1 Dev');
    setPhone('');
    setHasAlreadyPaid(false);
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
      setErrorMessage('Veuillez renseigner votre nom et prénom(s).');
      return;
    }

    if (totalPoloCount <= 0) {
      setErrorMessage('Veuillez sélectionner au moins 1 polo (utilisez les boutons +).');
      return;
    }

    setIsSubmitting(true);

    try {
      const autoColor = getColorFromClass(studentClass);
      const items: PoloItemChoice[] = POLO_SIZES.filter(
        (sz) => (selectedQuantities[sz] || 0) > 0
      ).map((sz) => ({
        color: autoColor,
        size: sz,
        quantity: selectedQuantities[sz],
      }));

      const primarySize: PoloSize = items[0]?.size || 'M';
      const todayIso = new Date().toISOString().split('T')[0];

      const paymentNote = hasAlreadyPaid
        ? 'Déjà payé (Reçu à présenter au Bureau Marketing)'
        : 'Non payé (Paiement à effectuer)';

      const noteParts: string[] = [];
      if (phone.trim()) noteParts.push(`Tél: ${phone.trim()}`);
      noteParts.push(paymentNote);
      if (notes.trim()) noteParts.push(notes.trim());

      const payload: Omit<StudentPoloOrder, 'id'> = {
        lastName: cleanLastName,
        firstName: cleanFirstName,
        studentClass: studentClass.trim() || 'B1 Dev',
        phone: phone.trim() || undefined,
        poloType: autoColor,
        size: primarySize,
        quantity: totalPoloCount,
        items,
        date: todayIso,
        paymentStatus: hasAlreadyPaid ? 'PAID' : 'UNPAID',
        amountPaid: hasAlreadyPaid ? totalPrice : 0,
        totalPrice: totalPrice,
        deliveryStatus: 'PENDING_STOCK',
        notes: noteParts.join(' • '),
      };

      const updatedList = await dataService.addPoloOrder(payload);
      const created = updatedList[0];
      setConfirmedOrder(created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Erreur commande polo:', err);
      setErrorMessage("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between selection:bg-bde-rose selection:text-white"
    >
      {/* Top Ambient Glow Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[140px] pointer-events-none bg-bde-rose/10" />

      {/* 1080 x 1920 Kiosk Shell: Fluid on mobile, exact 9:16 terminal proportions on wide screens */}
      <div className="w-full max-w-[560px] mx-auto min-h-screen flex flex-col justify-between px-4 sm:px-6 py-4 sm:py-6 relative z-10">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0 gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border text-slate-700 hover:text-slate-900 bg-white border-slate-200 shadow-sm transition-all active:scale-95"
            title="Retour au site BDE IFRAN"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Accueil BDE</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-bde-rose to-rose-400 p-0.5 shadow-lg shadow-rose-900/20 shrink-0">
              <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
                <Shirt size={18} className="text-bde-rose" />
              </div>
            </div>
            <h1 className="text-sm font-black tracking-wide text-slate-900 whitespace-nowrap">
              IFRAN - Commande de polos
            </h1>
          </div>

          {/* Invisible spacer to keep the title centered */}
          <div className="w-9 sm:w-24 shrink-0" aria-hidden="true" />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 py-4 space-y-4">
          {/* CONFIRMATION / SUCCESS SCREEN */}
          {confirmedOrder ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Success Badge Banner */}
              <div className="p-6 rounded-3xl border bg-white border-emerald-300 text-center space-y-3 shadow-xl relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border text-emerald-800 bg-emerald-100 border-emerald-200">
                    Commande Enregistrée avec Succès !
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black mt-2 text-slate-900">
                    Merci {confirmedOrder.firstName} !
                  </h2>
                  <p className="text-xs mt-1 max-w-sm mx-auto text-slate-600">
                    Votre commande de polo a bien été transmise en direct au système du BDE IFRAN.
                  </p>
                </div>

                {/* Ticket Reference Box */}
                <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 text-slate-700 text-left space-y-2 mt-4 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Référence Commande :</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      #{confirmedOrder.id.replace('polo_', '').slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Étudiant :</span>
                    <span className="font-bold text-slate-900">
                      {confirmedOrder.lastName.toUpperCase()} {confirmedOrder.firstName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Classe :</span>
                    <span className="font-bold text-slate-800">{confirmedOrder.studentClass}</span>
                  </div>
                  {confirmedOrder.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Téléphone :</span>
                      <span className="font-bold text-slate-800">{confirmedOrder.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Statut de paiement :</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        confirmedOrder.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {confirmedOrder.paymentStatus === 'PAID' ? 'Déjà Payé' : 'À Régler'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                    <span className="font-sans text-slate-600">Articles :</span>
                    <span className="font-bold text-slate-900">
                      {confirmedOrder.items && confirmedOrder.items.length > 0
                        ? confirmedOrder.items.map((it) => `${it.quantity}× ${it.size}`).join(', ')
                        : `${confirmedOrder.quantity || 1}× ${confirmedOrder.size}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="font-sans font-semibold text-slate-600">Total :</span>
                    <span className="font-black text-bde-rose text-base">
                      {formatCurrencyDots(confirmedOrder.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions Card Dynamique selon paiement */}
              <div className="p-5 rounded-3xl border bg-white border-slate-200 text-slate-700 space-y-3.5 text-xs shadow-sm">
                <div className="flex items-center gap-2.5 font-bold text-slate-900">
                  <Building2 size={17} className="text-bde-rose" />
                  <span>
                    {confirmedOrder.paymentStatus === 'PAID'
                      ? 'Comment récupérer votre polo déjà payé ?'
                      : 'Comment régler et récupérer votre polo ?'}
                  </span>
                </div>

                {confirmedOrder.paymentStatus === 'PAID' ? (
                  <div className="space-y-2.5 leading-relaxed text-slate-600">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                      <FileCheck2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-emerald-950 font-bold">Conservez précieusement votre reçu !</strong>
                        Présentez votre reçu de paiement lors du retrait au Bureau Marketing.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        Dès l'annonce de l'arrivée de la nouvelle vague de polos, rendez-vous au <strong className="text-slate-900">Bureau Marketing</strong>.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        Présentez votre <strong className="text-slate-900">reçu de paiement</strong> ainsi que votre nom pour vérification immédiate.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        Votre polo vous sera remis en priorité sans aucun frais supplémentaire !
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 leading-relaxed text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        Rendez-vous au <strong className="text-slate-900">Bureau du BDE / Bureau Marketing (RDC du campus)</strong> aux heures de permanence.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        Réglez votre commande en <strong className="text-slate-900">Espèces</strong>, par <strong className="text-slate-900">Wave</strong> ou <strong className="text-slate-900">Orange Money</strong> en indiquant votre nom, et conservez votre reçu.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-bde-rose font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        Si votre taille est en stock, elle vous est <strong className="text-slate-900">remise immédiatement</strong>. Sinon, elle sera prioritaire sur la livraison fournisseur !
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-Reset Countdown Bar */}
              <div className="p-4 rounded-2xl border bg-white border-slate-200 text-center space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-500" />
                    <span>Réinitialisation automatique pour l'étudiant suivant :</span>
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {resetCountdown}s
                  </span>
                </div>

                <div className="w-full h-2 rounded-full overflow-hidden bg-slate-200">
                  <div
                    className="bg-gradient-to-r from-bde-rose to-rose-400 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(resetCountdown / KIOSK_RESET_SECONDS) * 100}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md bg-slate-900 hover:bg-slate-800 text-white"
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
              <div className="p-4 rounded-2xl border bg-gradient-to-r from-rose-50/70 via-white to-slate-50 border-rose-200/80 flex items-center justify-between gap-3 shadow-sm">
                <div>
                  <h2 className="text-sm font-extrabold flex items-center gap-2 text-slate-900">
                    <Sparkles size={16} className="text-bde-rose shrink-0" />
                    <span>Commandez votre polo IFRAN 2026-2027</span>
                  </h2>
                  <p className="text-[11px] mt-0.5 text-slate-600">
                    Prix officiel :{' '}
                    <strong className="text-slate-900 font-bold">
                      {formatCurrencyDots(unitPrice)}
                    </strong>{' '}
                    par polo.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl border bg-rose-50 border-rose-300 text-rose-800 text-xs flex items-center gap-2.5 animate-shake">
                  <AlertTriangle size={17} className="text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: IDENTITÉ ÉTUDIANT */}
              <div className="p-4 rounded-2xl border bg-white border-slate-200 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold border-b pb-2 text-slate-900 border-slate-200">
                  <User size={15} className="text-bde-rose" />
                  <span>Étape 1 : Vos Informations</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-700">
                      Nom de famille *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: KOUASSI"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white text-xs focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all uppercase font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-700">
                      Prénom(s) *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Jean-Marc"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white text-xs focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all font-medium capitalize"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-700">
                      Classe / Filière *
                    </label>
                    <select
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white text-xs font-semibold focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all"
                    >
                      {IFRAN_CLASSES.map((c) => (
                        <option key={c} value={c} className="bg-white text-slate-900">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-700">
                      Numéro WhatsApp / Tél. (Retrait)
                    </label>
                    <div className="relative">
                      <Phone
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 07 00 00 00 00"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white text-xs font-mono focus:outline-none focus:border-bde-rose focus:ring-1 focus:ring-bde-rose transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: TAILLES ET QUANTITÉS */}
              <div className="p-4 rounded-2xl border bg-white border-slate-200 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold border-b pb-2 text-slate-900 border-slate-200">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={15} className="text-bde-rose" />
                    <span>Étape 2 : Tailles & Quantités</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-bde-rose">
                    Total : {totalPoloCount} polo(s)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {POLO_SIZES.map((sz) => {
                    const count = selectedQuantities[sz] || 0;

                    return (
                      <div
                        key={sz}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                          count > 0
                            ? 'border-bde-rose bg-rose-50/70 shadow-sm ring-1 ring-bde-rose'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <span className="font-mono font-black text-sm text-slate-900 whitespace-nowrap">
                            Taille {sz}
                          </span>
                        </div>

                        {/* Stepper Buttons */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleQuantityDelta(sz, -1)}
                            disabled={count <= 0}
                            className="w-8 h-8 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                            aria-label={`Diminuer taille ${sz}`}
                          >
                            <Minus size={14} />
                          </button>

                          <span className="font-mono font-black text-sm px-2 text-slate-900">
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
              </div>

              {/* STEP 3: STATUT DE PAIEMENT */}
              <div className="p-4 rounded-2xl border bg-white border-slate-200 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold border-b pb-2 text-slate-900 border-slate-200">
                  <CreditCard size={15} className="text-bde-rose" />
                  <span>Étape 3 : Avez-vous déjà payé votre polo ?</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHasAlreadyPaid(true)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 active:scale-98 ${
                      hasAlreadyPaid
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        hasAlreadyPaid
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {hasAlreadyPaid && <span className="text-[10px] font-black">✓</span>}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        Oui, j'ai déjà payé
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        J'ai mon reçu de paiement (Wave, OM, espèces ou scolarité).
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasAlreadyPaid(false)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 active:scale-98 ${
                      !hasAlreadyPaid
                        ? 'border-bde-rose bg-rose-50/80 ring-2 ring-bde-rose shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        !hasAlreadyPaid
                          ? 'border-bde-rose bg-bde-rose text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {!hasAlreadyPaid && <span className="text-[10px] font-black">✓</span>}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        Non, pas encore payé
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Je réglerai au Bureau du BDE / Marketing lors du retrait.
                      </p>
                    </div>
                  </button>
                </div>

                {hasAlreadyPaid && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                    <FileCheck2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Rappel important :</strong> Veuillez bien conserver votre <strong>reçu de paiement</strong>. Vous devrez obligatoirement le présenter au <strong>Bureau Marketing</strong> dès réception des polos pour récupérer votre commande.
                    </span>
                  </div>
                )}
              </div>

              {/* RECAP & VALIDATION */}
              <div className="p-4 rounded-2xl border bg-white border-slate-200 space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Total sélectionné :</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {totalPoloCount} polo(s)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Prix unitaire officiel :</span>
                  <span className="font-mono text-slate-700">{formatCurrencyDots(unitPrice)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Statut de paiement :</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      hasAlreadyPaid
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {hasAlreadyPaid ? 'Déjà Payé' : 'À Régler'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">
                    {hasAlreadyPaid ? 'Montant payé déclaré :' : 'Montant total à régler :'}
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
              <div className="text-center text-[10px] flex items-center justify-center gap-1.5 pt-1 text-slate-400">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Plateforme sécurisée officielle · BDE IFRAN Abidjan</span>
              </div>
            </form>
          )}
        </main>

        {/* Bottom Footer Bar */}
        <footer className="pt-3 pb-1 border-t border-slate-200 text-center text-[10px] text-slate-500 shrink-0">
          IFRAN BDE CONNECT • Design by Mehdi Traore
        </footer>
      </div>
    </div>
  );
};

export default PoloOrderKiosk;
