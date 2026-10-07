import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { generatePresidentMandateReport } from '../../services/pdfService';
import { 
  Event, 
  Student, 
  Club, 
  Atelier, 
  FoodOrder, 
  CinemaSale, 
  ProspectContact, 
  Member,
  MandateReportData 
} from '../../types';
import { 
  Award, 
  Download, 
  Printer, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Calendar, 
  Sparkles, 
  FileText, 
  DollarSign, 
  Utensils, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  HeartHandshake
} from 'lucide-react';

// Helper to sanitize corrupted strings like "&½þ"
export const cleanEventTitle = (title: string): string => {
  if (!title) return '';
  return title
    .replace(/&½þ|&½|&þ|½þ/g, '& E-Sport')
    .replace(/foot &½þ/gi, 'Foot & E-Sport')
    .replace(/foot &½/gi, 'Foot & E-Sport')
    .replace(/[^\x20-\x7E\xA0-\xFF\u0100-\u017F\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u20AC]/g, ' ')
    .trim();
};

export const cleanEventText = (txt?: string): string => {
  if (!txt) return '';
  return txt
    .replace(/&½þ|&½|&þ|½þ/g, '& E-Sport')
    .replace(/[^\x20-\x7E\xA0-\xFF\u0100-\u017F\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u20AC]/g, ' ')
    .trim();
};

// Precise club missions conforming strictly to President's mandate realities
export const getMandateClubMission = (clubName: string, defaultDesc?: string): string => {
  const lower = (clubName || '').toLowerCase();
  if (lower.includes('kurotsuki') || lower.includes('model')) {
    return "Organisaient des défilés de mode, prenaient des photos et réalisaient des vidéos.";
  }
  if (lower.includes('studio') || lower.includes('music') || lower.includes('musique')) {
    return "Ils voulaient écouter de la musique et chanter, mais ça n'a jamais eu lieu.";
  }
  if (lower.includes('fitness') || lower.includes('sport')) {
    return "Ils voulaient faire du sport mais ça n'a jamais eu lieu.";
  }
  if (lower.includes('créati') || lower.includes('creati') || lower.includes('art')) {
    return "Ils ont fait des dessins et customisé des objets durant leurs ateliers.";
  }
  if (lower.includes('finance') || lower.includes('investiss') || lower.includes('crypto')) {
    return "Ils voulaient parler d'argent, de cryptos.";
  }
  return defaultDesc || "Activités et initiatives étudiantes.";
};

const AdminMandateReport: React.FC = () => {
  // State for fetched data
  const [events, setEvents] = useState<Event[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [cinemaSales, setCinemaSales] = useState<CinemaSale[]>([]);
  const [prospects, setProspects] = useState<ProspectContact[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  // Active view tab (Recommendations tab removed as explicitly requested)
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'finances' | 'clubs' | 'digital'>('overview');

  // Filter for events
  const [eventFilter, setEventFilter] = useState<'all' | 'past' | 'upcoming'>('all');

  // Customizable Mandate metadata stored in localStorage
  const defaultPresidentName = 'Traoré Abdou-Rahmane Méhdi';
  const defaultMandatePeriod = 'Mandat 2024–2025 / 2025–2026';
  const defaultAcademicYear = '2024–2025 / 2025–2026';
  const defaultSubmissionDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const defaultRecipient = "À l'attention de la Direction Générale et de l'Administration de l'IFRAN";

  const defaultMoralReport = 
    "À l'heure de dresser le bilan de ce mandat à la présidence du Bureau des Étudiants de l'IFRAN, c'est avec un profond sentiment d'honneur, de fierté et de devoir accompli que nous soumettons ce rapport officiel à l'Administration. Dès notre prise de fonction, notre vision s'est articulée autour de trois axes cardinaux : fédérer l'ensemble des promotions autour d'une vie de campus vibrante, valoriser les compétences de nos étudiants par des ateliers pratiques de haut niveau, et instaurer une gestion administrative et financière rigoureuse, transparente et pérenne.\n\n" +
    "Pratiquement chaque initiative promise a été traduite en action concrète et intégrée directement au sein de notre écosystème numérique BDE. De la mise en place d'ateliers réguliers à la dynamisation des clubs permanents, en passant par nos grands rassemblements festifs et culturels (Sorties, Projections Cinéma, Soirées), ainsi que la digitalisation de nos services étudiants (gestion de la cantine et relances personnalisées), notre équipe s'est investie sans compter au service de l'excellence de l'IFRAN.";

  const defaultConclusion = 
    "Ce mandat aura prouvé la vitalité, l'ingéniosité et l'esprit de corps qui animent les étudiants de l'IFRAN. Nous adressons nos remerciements les plus sincères à la Direction de l'IFRAN, aux enseignants, au personnel administratif et à l'ensemble des délégués et responsables de clubs. Nous transmettons aujourd'hui un Bureau structuré, doté d'outils modernes et d'un bilan financier transparent, prêt à être porté encore plus haut par la future génération.";

  // State for editable fields (preserves existing President speech without changing user text)
  const [presidentName, setPresidentName] = useState(() => localStorage.getItem('mandate_pres_name') || defaultPresidentName);
  const [presidentPhone, setPresidentPhone] = useState(() => localStorage.getItem('mandate_pres_phone') || '+225 07 89 60 96 72');
  const [presidentEmail, setPresidentEmail] = useState(() => localStorage.getItem('mandate_pres_email') || 'traoremehdi6@gmail.com');
  const [mandatePeriod, setMandatePeriod] = useState(() => localStorage.getItem('mandate_period') || defaultMandatePeriod);
  const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('mandate_acad_year') || defaultAcademicYear);
  const [submissionDate, setSubmissionDate] = useState(() => localStorage.getItem('mandate_sub_date') || defaultSubmissionDate);
  const [recipient, setRecipient] = useState(() => localStorage.getItem('mandate_recipient') || defaultRecipient);
  const [moralReport, setMoralReport] = useState(() => localStorage.getItem('mandate_moral_report') || defaultMoralReport);
  const [conclusion, setConclusion] = useState(() => localStorage.getItem('mandate_conclusion') || defaultConclusion);

  // Load live data from dataService
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        evts, 
        stds, 
        clbs, 
        atls, 
        orders, 
        cinema, 
        pros, 
        mbrs
      ] = await Promise.all([
        dataService.fetchEvents().catch(() => []),
        dataService.fetchStudents().catch(() => []),
        dataService.fetchClubs().catch(() => []),
        dataService.fetchAteliers().catch(() => []),
        dataService.fetchFoodOrders().catch(() => []),
        dataService.fetchCinemaSales().catch(() => []),
        dataService.fetchProspects().catch(() => []),
        dataService.fetchMembers().catch(() => []),
      ]);

      setEvents(evts);
      setStudents(stds);
      setClubs(clbs);
      setAteliers(atls);
      setFoodOrders(orders);
      setCinemaSales(cinema);
      setProspects(pros);
      setMembers(mbrs);
    } catch (e) {
      console.error("Erreur lors du chargement des données pour le bilan:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Save customized settings
  const handleSaveSettings = () => {
    localStorage.setItem('mandate_pres_name', presidentName);
    localStorage.setItem('mandate_pres_phone', presidentPhone);
    localStorage.setItem('mandate_pres_email', presidentEmail);
    localStorage.setItem('mandate_period', mandatePeriod);
    localStorage.setItem('mandate_acad_year', academicYear);
    localStorage.setItem('mandate_sub_date', submissionDate);
    localStorage.setItem('mandate_recipient', recipient);
    localStorage.setItem('mandate_moral_report', moralReport);
    localStorage.setItem('mandate_conclusion', conclusion);

    setIsEditModalOpen(false);
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 3000);
  };

  // Financial aggregates strictly conforming to President's mandate facts:
  // - Cotisations Assinie recensées : 135 000 FCFA
  // - Dépenses directes Assinie : 135 000 FCFA (utilisées directement pour faire la sortie, non conservées)
  // - Cinéma : argent retiré de notre propre poche (-15 000 FCFA sur fonds propres, aucune cotisation perçue)
  // - Solde de trésorerie transmis au futur Bureau : 0 FCFA (aucun reliquat)
  const financialStats = useMemo(() => {
    const cotisationsAssinie = 135000;
    const depensesAssinie = 135000;
    const cinemaBureauDebit = 15000; // Argent retiré de notre poche
    const treasuryBalance = 0; // Aucun reliquat conservé

    return {
      totalCotisations: cotisationsAssinie,
      depensesAssinie,
      cinemaBureauDebit,
      consolidatedRevenue: cotisationsAssinie,
      treasuryBalance,
    };
  }, []);

  // Key pillars data
  const pillars = useMemo(() => [
    {
      title: "1. Animation & Grands Événements Fédérateurs",
      icon: Calendar,
      achievements: [
        "Organisation d'événements majeurs (Projections Cinéma BDE autofinancées sur fonds propres du Bureau, Sortie détente à Assinie financée par les participants, Soirées et animations).",
        "Maintien d'un calendrier régulier d'animation de la vie étudiante accessible à toutes les filières de l'IFRAN.",
        "Renforcement du sentiment d'appartenance et de la cohésion inter-promotions."
      ]
    },
    {
      title: "2. Structuration des Clubs Permanents & Ateliers Afternoon",
      icon: Sparkles,
      achievements: [
        `${clubs.length} clubs permanents structurés avec responsables désignés et programmes d'activités suivis.`,
        `${ateliers.length} ateliers pratiques pour le perfectionnement technologique et créatif des étudiants.`,
        "Promotion du tutorat et du partage d'expérience entre étudiants seniors et nouveaux arrivants."
      ]
    },
    {
      title: "3. Digitalisation des Services Étudiants (Plateforme Web BDE)",
      icon: TrendingUp,
      achievements: [
        "Développement et déploiement d'une plateforme web complète (BDE Connect) pour l'agenda, les inscriptions et la billetterie.",
        `Lancement du module Cantine Connectée ayant géré ${foodOrders.length} commandes en ligne pour fluidifier la restauration (recettes gérées par la prestataire indépendante).`,
        "Automatisation de la gestion des listes et des comptes-rendus administratifs."
      ]
    },
    {
      title: "4. Communication Institutionnelle & Rayonnement BDE",
      icon: Users,
      achievements: [
        "Diffusion continue des opportunités, actualités et rendez-vous du campus auprès de toutes les promotions.",
        "Mise en place de canaux d'échange directs et personnalisés pour recueillir les suggestions et doléances étudiantes.",
        "Accompagnement et orientation personnalisée des nouveaux arrivants et étudiants intégrés."
      ]
    },
    {
      title: "5. Rigueur de Gestion & Transparence Financière",
      icon: DollarSign,
      achievements: [
        "135.000 FCFA de cotisations recensées pour la sortie Assinie et intégralement affectées au séjour des étudiants.",
        "15.000 FCFA déboursés directement sur les fonds personnels du Bureau pour l'organisation des séances cinéma.",
        "Solde de trésorerie net clôturé à 0 FCFA (aucune dette, aucun reliquat non affecté)."
      ]
    }
  ], [clubs, ateliers, foodOrders, financialStats]);

  // Generate PDF Handler with school logo loaded
  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Fetch school logo as base64 DataURL
      let logoDataUrl: string | undefined = undefined;
      try {
        const res = await fetch('/logo.png');
        if (res.ok) {
          const blob = await res.blob();
          logoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {
        console.warn("Could not load logo for PDF:", e);
      }

      const mandateData: MandateReportData = {
        presidentName,
        presidentPhone,
        presidentEmail,
        mandatePeriod,
        academicYear,
        submissionDate,
        recipient,
        executiveSummary: moralReport.substring(0, 300) + '...',
        moralReport,
        keyPillars: pillars.map(p => ({
          title: p.title,
          achievements: p.achievements
        })),
        events: events.map(e => ({
          title: cleanEventTitle(e.title),
          date: e.date,
          location: e.location,
          status: e.status,
          description: cleanEventText(e.description)
        })),
        clubsCount: clubs.length,
        clubsList: clubs.map(c => ({
          name: c.name,
          leader: c.leaderName,
          activities: getMandateClubMission(c.name, c.activities?.join(', '))
        })),
        ateliersCount: ateliers.length,
        ateliersList: ateliers.map(a => ({
          name: a.name,
          room: a.room
        })),
        finances: {
          totalCollectedCotisations: financialStats.totalCotisations,
          contributorsCount: students.filter(s => s.hasPaid).length || 1,
          cinemaBureauContribution: financialStats.cinemaBureauDebit,
          totalConsolidatedRevenue: financialStats.consolidatedRevenue,
          estimatedExpenses: financialStats.depensesAssinie,
          treasuryBalance: 0
        },
        logoDataUrl,
        prospectsCount: prospects.length,
        sentProspectsCount: prospects.filter(p => p.status === 'sent').length,
        canteenOrdersCount: foodOrders.length,
        conclusion
      };

      generatePresidentMandateReport(mandateData);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      alert("Une erreur est survenue lors de la génération du rapport PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return events;
    return events.filter(e => e.status === eventFilter);
  }, [events, eventFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-16">
        
        {/* 1. TOP EXECUTIVE ACTION BAR (WELL SEPARATED FROM THE OFFICIAL TITLE) */}
        <div className="bg-gradient-to-r from-bde-navy via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-xl border border-white/10 relative overflow-hidden mb-8">
          <div className="absolute right-0 top-0 w-96 h-96 bg-bde-rose/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-bde-rose text-white rounded-xl shadow-md">
                  <Award size={24} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-rose-300 font-bold">Espace Gouvernance & Direction</span>
                    <span className="text-xs text-white/40">·</span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck size={14} /> Prêt pour dépôt officiel
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    Gestion du Bilan de Mandat Présidentiel
                  </h2>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
                Générez, imprimez et personnalisez le document officiel destiné à la Direction Générale de l'IFRAN.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition border border-white/15"
                title="Modifier les textes officiels et le mot du président"
              >
                <Edit3 size={16} />
                <span>Personnaliser</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-700"
                title="Imprimer ou enregistrer au format PDF d'impression"
              >
                <Printer size={16} />
                <span>Imprimer (A4)</span>
              </button>

              <button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf || loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-bde-rose hover:bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    <span>Génération PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={17} />
                    <span>Générer le Rapport PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Success toast */}
        {saveSuccessNotification && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-fade-in mb-6">
            <CheckCircle2 size={18} />
            <span>Vos personnalisations de mandat ont été enregistrées avec succès !</span>
          </div>
        )}

        {/* 2. OFFICIAL INSTITUTIONAL HEADER & TITLE WITH SCHOOL LOGO */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-700/80 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <img src="/logo.png" alt="Logo IFRAN" className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Document Officiel de Gouvernance</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">IFRAN Côte d'Ivoire</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-bde-navy dark:text-white tracking-tight mt-1">
                RAPPORT DE BILAN DE MANDAT PRÉSIDENTIEL
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Présidence de <strong className="text-gray-900 dark:text-white underline decoration-bde-rose">{presidentName}</strong> · Période : <strong className="text-gray-700 dark:text-gray-300">{mandatePeriod}</strong> · {academicYear}
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 shrink-0">
            <div>Dépôt officiel : <strong className="text-gray-800 dark:text-gray-200">{submissionDate}</strong></div>
            <div className="mt-1">Destinataire : <strong className="text-gray-800 dark:text-gray-200">{recipient}</strong></div>
          </div>
        </div>

        {/* 3. KEY METRICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
              <span>Événements</span>
              <Calendar size={16} className="text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-bde-navy dark:text-white tabular-nums">
              {events.length}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {events.filter(e => e.status === 'past').length} réalisés
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
              <span>Clubs & Ateliers</span>
              <Sparkles size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-bde-navy dark:text-white tabular-nums">
              {clubs.length + ateliers.length}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {clubs.length} clubs · {ateliers.length} ateliers
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
              <span>Sortie Assinie</span>
              <DollarSign size={16} className="text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-bde-navy dark:text-white tabular-nums truncate">
              135.000 Fcfa
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              100% utilisé pour la sortie
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
              <span>Cinéma (Poche Bureau)</span>
              <HeartHandshake size={16} className="text-rose-500" />
            </div>
            <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums truncate">
              -15 000 F
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Argent retiré / Débit net
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
              <span>Solde Transmis</span>
              <TrendingUp size={16} className="text-slate-500" />
            </div>
            <div className="text-xl font-extrabold text-bde-navy dark:text-white tabular-nums truncate">
              0 F
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Fonds 100% consommés
            </div>
          </div>
        </div>

        {/* 4. NAVIGATION TABS (WITHOUT RECOMMENDATIONS/SIGNATURES) */}
        <div className="border-b border-gray-200 dark:border-slate-700 flex overflow-x-auto no-scrollbar gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 font-semibold text-sm whitespace-nowrap border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-bde-rose text-bde-rose dark:text-rose-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Vue Synthétique & Discours
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`py-3 px-4 font-semibold text-sm whitespace-nowrap border-b-2 transition ${
              activeTab === 'events'
                ? 'border-bde-rose text-bde-rose dark:text-rose-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Événements & Activités ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('finances')}
            className={`py-3 px-4 font-semibold text-sm whitespace-nowrap border-b-2 transition ${
              activeTab === 'finances'
                ? 'border-bde-rose text-bde-rose dark:text-rose-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Bilan Financier & Ressources
          </button>

          <button
            onClick={() => setActiveTab('clubs')}
            className={`py-3 px-4 font-semibold text-sm whitespace-nowrap border-b-2 transition ${
              activeTab === 'clubs'
                ? 'border-bde-rose text-bde-rose dark:text-rose-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Clubs & Ateliers Afternoon
          </button>

          <button
            onClick={() => setActiveTab('digital')}
            className={`py-3 px-4 font-semibold text-sm whitespace-nowrap border-b-2 transition ${
              activeTab === 'digital'
                ? 'border-bde-rose text-bde-rose dark:text-rose-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Innovation Digitale & Services
          </button>
        </div>

        {/* TAB 1: OVERVIEW & SPEECH (PRESIDENT SPEECH KEPT EXACTLY AS CURRENTLY TYPED) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 1 · Bilan Moral</span>
                  <h2 className="text-xl font-extrabold text-bde-navy dark:text-white mt-1">
                    Discours d'Ouverture du Président
                  </h2>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs text-bde-rose hover:underline font-semibold flex items-center gap-1"
                >
                  <Edit3 size={14} /> Modifier le texte
                </button>
              </div>

              {/* Exact President opening statement preserved without any alteration */}
              <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-slate-900/50 p-6 rounded-xl border border-gray-100 dark:border-slate-800">
                {moralReport}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bde-navy text-white flex items-center justify-center font-bold text-sm">
                    {presidentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{presidentName}</div>
                    <div>Président du BDE IFRAN · {mandatePeriod}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div>Document officiel soumis le <strong>{submissionDate}</strong></div>
                  <div>Destinataire : <strong>{recipient}</strong></div>
                </div>
              </div>
            </div>

            {/* The 5 Strategic Pillars Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 2 · Axes Stratégiques</span>
                  <h2 className="text-xl font-extrabold text-bde-navy dark:text-white">
                    Les 5 Piliers d'Accomplissement du Mandat
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pillars.map((pillar, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="p-2.5 bg-bde-navy/5 dark:bg-white/5 text-bde-rose rounded-xl">
                          <pillar.icon size={22} />
                        </span>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                          {pillar.title}
                        </h3>
                      </div>

                      <ul className="space-y-2.5">
                        {pillar.achievements.map((ach, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVENTS & ACTIVITIES (HEADER 'Description', SANITIZED TEXT & CONTROLLED WRAPPING) */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 3 · Vie Étudiante</span>
                  <h2 className="text-xl font-extrabold text-bde-navy dark:text-white mt-1">
                    Tableau des Événements & Actions de la Vie Étudiante
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Répertoire complet des actions menées avec suivi des statuts et descriptions détaillées.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setEventFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      eventFilter === 'all'
                        ? 'bg-white dark:bg-slate-800 text-bde-navy dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Tous ({events.length})
                  </button>
                  <button
                    onClick={() => setEventFilter('past')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      eventFilter === 'past'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Réalisés ({events.filter(e => e.status === 'past').length})
                  </button>
                  <button
                    onClick={() => setEventFilter('upcoming')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      eventFilter === 'upcoming'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    En cours ({events.filter(e => e.status === 'upcoming').length})
                  </button>
                </div>
              </div>

              {/* Table with Colored Rows and 'Description' Header */}
              <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-bde-navy text-white text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 font-bold w-24">Date</th>
                      <th className="p-3.5 font-bold min-w-[200px]">Activité / Événement</th>
                      <th className="p-3.5 font-bold w-36">Lieu</th>
                      <th className="p-3.5 font-bold w-32">Statut</th>
                      <th className="p-3.5 font-bold min-w-[260px]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Aucun événement trouvé pour ce filtre.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((evt) => {
                        const isPast = evt.status === 'past';
                        const isUpcoming = evt.status === 'upcoming';

                        const rowClass = isPast
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 hover:bg-emerald-100/60 transition-colors'
                          : isUpcoming
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/60 transition-colors'
                          : 'bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100/60 transition-colors';

                        const statusBadge = isPast ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            <CheckCircle2 size={13} /> Réalisé
                          </span>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                            <Clock size={13} /> En cours / Prévu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                            <AlertCircle size={13} /> Annulé
                          </span>
                        );

                        return (
                          <tr key={evt.id} className={rowClass}>
                            <td className="p-3.5 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                              {evt.date ? new Date(evt.date).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td className="p-3.5 font-bold text-bde-navy dark:text-white break-words max-w-[220px]">
                              {cleanEventTitle(evt.title)}
                            </td>
                            <td className="p-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {evt.location || 'Campus IFRAN'}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              {statusBadge}
                            </td>
                            <td className="p-3.5 text-gray-600 dark:text-gray-300 break-words max-w-sm">
                              {cleanEventText(evt.description) || 'Activité officielle BDE'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FINANCES (RECENSEMENT DES PAIEMENTS, ASSINIE 100% UTILISÉE, CINÉMA EN DÉBIT, SOLDE TRANSMIS = 0) */}
        {activeTab === 'finances' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 4 · Trésorerie & Comptabilité</span>
                <h2 className="text-xl font-extrabold text-bde-navy dark:text-white mt-1">
                  Bilan Financier & Recensement des Flux
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Recensement des cotisations perçues pour Assinie et des fonds personnels déboursés par le Bureau.
                </p>
              </div>

              {/* Financial Highlights Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-5 rounded-xl border border-blue-200 dark:border-blue-900/50">
                  <div className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">Cotisations Assinie (Recensées)</div>
                  <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-100 tabular-nums mt-1">
                    135 000 FCFA
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    100% utilisé pour faire la sortie (non conservé)
                  </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/30 p-5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  <div className="text-xs font-bold uppercase text-rose-700 dark:text-rose-300">Cinéma (Argent retiré de notre poche)</div>
                  <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 tabular-nums mt-1">
                    -15 000 FCFA
                  </div>
                  <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                    Pris sur nos propres fonds (aucune cotisation)
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">Solde Transmis à la Trésorerie</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                    0 FCFA
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Fonds entièrement consommés sur les activités
                  </div>
                </div>
              </div>

              {/* Consolidated Accounting Table */}
              <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 font-bold w-2/5 min-w-[200px]">Poste & Activité</th>
                      <th className="p-3.5 font-bold w-2/5 min-w-[260px]">Précisions & Affectation des Fonds</th>
                      <th className="p-3.5 font-bold w-1/5 min-w-[140px] text-right">Montant (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-750">
                      <td className="p-3.5 font-semibold text-gray-900 dark:text-white">
                        Cotisations Sortie Assinie
                      </td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-300">
                        Recensement des cotisations volontaires versées par les étudiants pour la sortie détente (non obligatoire)
                      </td>
                      <td className="p-3.5 font-mono font-bold text-right tabular-nums whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                        +135.000 FCFA
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-750">
                      <td className="p-3.5 font-semibold text-gray-900 dark:text-white">
                        Dépenses Logistique Sortie Assinie
                      </td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-300">
                        Utilisation directe et intégrale des cotisations pour financer le transport, le séjour et les activités
                      </td>
                      <td className="p-3.5 font-mono font-bold text-right tabular-nums whitespace-nowrap text-rose-600 dark:text-rose-400">
                        -135.000 FCFA
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-750">
                      <td className="p-3.5 font-semibold text-gray-900 dark:text-white">
                        Projections Cinéma BDE (Fonds personnels)
                      </td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-300">
                        Aucune cotisation perçue des étudiants — Argent retiré de notre propre poche par le Bureau pour financer la projection
                      </td>
                      <td className="p-3.5 font-mono font-bold text-right tabular-nums whitespace-nowrap text-rose-600 dark:text-rose-400">
                        -15.000 FCFA
                      </td>
                    </tr>

                    <tr className="bg-blue-50/70 dark:bg-blue-950/20 font-bold">
                      <td className="p-3.5 text-blue-900 dark:text-blue-100">
                        TOTAL DES COTISATIONS RECENSÉES
                      </td>
                      <td className="p-3.5 text-blue-800 dark:text-blue-200">
                        Totalité des fonds collectés auprès des étudiants (exclusivement pour la sortie Assinie)
                      </td>
                      <td className="p-3.5 font-mono text-right tabular-nums whitespace-nowrap text-blue-900 dark:text-blue-100">
                        135.000 FCFA
                      </td>
                    </tr>

                    <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                      <td className="p-3.5 text-gray-800 dark:text-gray-200">
                        SOLDE DE TRÉSORERIE TRANSMIS AU FUTUR BUREAU
                      </td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-400">
                        Aucun reliquat conservé — Les cotisations ont été 100% consommées par la sortie et le cinéma a été pris sur nos poches
                      </td>
                      <td className="p-3.5 font-mono text-right tabular-nums whitespace-nowrap text-gray-700 dark:text-gray-300">
                        0 FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Clarification notes */}
              <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>• <strong>Sortie Assinie</strong> : Les 135 000 FCFA perçus n'ont pas été stockés en trésorerie mais immédiatement dépensés pour payer les frais réels du voyage.</div>
                <div>• <strong>Projections Cinéma</strong> : L'organisation a constitué un apport négatif (prise en charge sur les fonds propres des membres du Bureau, sans cotisation étudiante).</div>
                <div>• <strong>Cantine</strong> : Recettes encaissées directement par la prestataire de restauration indépendante.</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLUBS & WORKSHOPS (EXACT MISSIONS ENFORCED) */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 5 · Clubs & Pédagogie</span>
                <h2 className="text-xl font-extrabold text-bde-navy dark:text-white mt-1">
                  Structuration des Clubs Permanents & Ateliers Afternoon
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Missions réelles et activités menées par chaque club durant l'année académique.
                </p>
              </div>

              {/* Clubs List with exact missions */}
              <div className="space-y-4 mb-8">
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-bde-rose" />
                  <span>Clubs Permanents ({clubs.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clubs.map(club => {
                    const realMission = getMandateClubMission(club.name, club.description);

                    return (
                      <div key={club.id} className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/40 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-bde-navy dark:text-white text-base">{club.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Responsable : <strong className="text-gray-700 dark:text-gray-300">{club.leaderName || 'Coordination BDE'}</strong>
                              </div>
                            </div>
                            {club.emoji && <span className="text-2xl">{club.emoji}</span>}
                          </div>
                          
                          <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                            <span className="text-[11px] font-bold uppercase text-bde-rose block mb-1">Mission & Activités :</span>
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                              {realMission}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ateliers Afternoon */}
              <div className="space-y-4">
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>Ateliers Afternoon ({ateliers.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ateliers.map(atelier => (
                    <div key={atelier.id} className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{atelier.emoji || '💡'}</span>
                        <div className="font-bold text-bde-navy dark:text-white text-sm">{atelier.name}</div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Salle assignée : <span className="font-semibold text-gray-700 dark:text-gray-300">{atelier.room || 'Campus IFRAN'}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                        {atelier.description || 'Perfectionnement technique et pratique des compétences.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DIGITAL INNOVATION (CONTAINED WITH NO OVERFLOW) */}
        {activeTab === 'digital' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 6 · Digitalisation & Communication</span>
                <h2 className="text-xl font-extrabold text-bde-navy dark:text-white mt-1">
                  Innovations Numériques & Services aux Étudiants
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Outils créés durant le mandat pour moderniser la vie étudiante et la relation avec l'Administration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="p-3 bg-indigo-500 text-white rounded-xl w-fit mb-3">
                      <FileText size={20} />
                    </div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
                      Plateforme BDE Connect
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words">
                      Centralisation complète de l'agenda des événements, de la galerie photo, des inscriptions aux clubs et ateliers, et du tutorat entre promotions.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    Accessible 24/7 sur web & mobile
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-orange-50/50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="p-3 bg-orange-500 text-white rounded-xl w-fit mb-3">
                      <Utensils size={20} />
                    </div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
                      Module Cantine Digitale
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words">
                      Précommande en ligne des déjeuners, gestion des menus et réduction drastique de l'attente (recettes encaissées par la prestataire externe).
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                    {foodOrders.length} précommandes traitées
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-teal-50/50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="p-3 bg-teal-500 text-white rounded-xl w-fit mb-3">
                      <Users size={20} />
                    </div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
                      Communication & Réseaux Étudiants
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words">
                      Diffusion continue de l'actualité des promotions, recueil des besoins étudiants et coordination constante avec l'Administration IFRAN.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-teal-600 dark:text-teal-400 font-semibold">
                    Couverture de l'ensemble des filières
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* EDIT MODAL / DRAWER FOR CUSTOMIZING MANDATE METADATA */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-slate-700 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Sliders size={20} className="text-bde-rose" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Personnalisation du Rapport de Mandat
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Nom Complet du Président
                  </label>
                  <input
                    type="text"
                    value={presidentName}
                    onChange={(e) => setPresidentName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone de Contact
                  </label>
                  <input
                    type="text"
                    value={presidentPhone}
                    onChange={(e) => setPresidentPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Email de Contact
                  </label>
                  <input
                    type="email"
                    value={presidentEmail}
                    onChange={(e) => setPresidentEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Période du Mandat
                  </label>
                  <input
                    type="text"
                    value={mandatePeriod}
                    onChange={(e) => setMandatePeriod(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Année Académique
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Date de Dépôt Officiel
                  </label>
                  <input
                    type="text"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Destinataire Officiel
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Bilan Moral & Discours d'Introduction du Président
                </label>
                <textarea
                  rows={4}
                  value={moralReport}
                  onChange={(e) => setMoralReport(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Conclusion du Mandat
                </label>
                <textarea
                  rows={3}
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-700 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-semibold transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-bde-rose hover:bg-rose-600 text-white rounded-lg font-bold shadow-md transition flex items-center gap-2"
              >
                <Save size={16} />
                <span>Enregistrer les Modifications</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-specific layout styling */}
      <style>{`
        @media print {
          aside, nav, button, .no-print {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

export default AdminMandateReport;
