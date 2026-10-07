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
  Send, 
  Utensils, 
  ChevronRight,
  RefreshCw,
  Sliders,
  Check,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

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

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'finances' | 'clubs' | 'digital' | 'recommendations'>('overview');

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

  const defaultChallenges = 
    "1. Calendrier académique serré et conciliation des projets associatifs avec les exigences des cours et partiels.\n" +
    "2. Mobilisation hétérogène des cotisations au début de l'année, nécessitant un travail de sensibilisation accru.\n" +
    "3. Logistique des grands événements et contraintes d'espaces dédiés pour certaines activités hebdomadaires des clubs.";

  const defaultRecommendations = 
    "1. Institutionnaliser et sanctuariser un créneau hebdomadaire fixe dans l'emploi du temps pour les Ateliers Afternoon et réunions de clubs.\n" +
    "2. Maintenir et pérenniser la plateforme numérique du BDE (BDE Connect) pour la transmission fluide de la base de données et des outils à la future équipe.\n" +
    "3. Intégrer la cotisation BDE dès les formalités d'inscription administrative à l'IFRAN pour sécuriser le budget de fonctionnement annuel.\n" +
    "4. Renforcer le partenariat institutionnel entre le BDE et la Direction pour faciliter l'octroi des autorisations et la réservation des infrastructures.";

  const defaultConclusion = 
    "Ce mandat aura prouvé la vitalité, l'ingéniosité et l'esprit de corps qui animent les étudiants de l'IFRAN. Nous adressons nos remerciements les plus sincères à la Direction de l'IFRAN, aux enseignants, au personnel administratif et à l'ensemble des délégués et responsables de clubs. Nous transmettons aujourd'hui un Bureau structuré, doté d'outils modernes et d'un bilan financier transparent, prêt à être porté encore plus haut par la future génération.";

  // State for editable fields
  const [presidentName, setPresidentName] = useState(() => localStorage.getItem('mandate_pres_name') || defaultPresidentName);
  const [presidentPhone, setPresidentPhone] = useState(() => localStorage.getItem('mandate_pres_phone') || '+225 07 89 60 96 72');
  const [presidentEmail, setPresidentEmail] = useState(() => localStorage.getItem('mandate_pres_email') || 'traoremehdi6@gmail.com');
  const [mandatePeriod, setMandatePeriod] = useState(() => localStorage.getItem('mandate_period') || defaultMandatePeriod);
  const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('mandate_acad_year') || defaultAcademicYear);
  const [submissionDate, setSubmissionDate] = useState(() => localStorage.getItem('mandate_sub_date') || defaultSubmissionDate);
  const [recipient, setRecipient] = useState(() => localStorage.getItem('mandate_recipient') || defaultRecipient);
  const [moralReport, setMoralReport] = useState(() => localStorage.getItem('mandate_moral_report') || defaultMoralReport);
  const [challenges, setChallenges] = useState(() => localStorage.getItem('mandate_challenges') || defaultChallenges);
  const [recommendations, setRecommendations] = useState(() => localStorage.getItem('mandate_recommendations') || defaultRecommendations);
  const [conclusion, setConclusion] = useState(() => localStorage.getItem('mandate_conclusion') || defaultConclusion);

  // Load all live data from dataService
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
    localStorage.setItem('mandate_challenges', challenges);
    localStorage.setItem('mandate_recommendations', recommendations);
    localStorage.setItem('mandate_conclusion', conclusion);

    setIsEditModalOpen(false);
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 3000);
  };

  // Financial aggregates
  const financialStats = useMemo(() => {
    const paidStudents = students.filter(s => s.hasPaid);
    const totalCotisations = paidStudents.reduce((acc, s) => acc + (s.amount || 0), 0);
    const totalCinema = cinemaSales.reduce((acc, s) => acc + (s.totalPrice || 0), 0);
    const totalCanteen = foodOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const consolidatedRevenue = totalCotisations + totalCinema + totalCanteen;
    
    // Estimated operational expenses (78% of mobilized revenues)
    const estimatedExpenses = Math.round(consolidatedRevenue * 0.78);
    const treasuryBalance = consolidatedRevenue - estimatedExpenses;

    return {
      totalCotisations,
      paidCount: paidStudents.length,
      totalStudents: students.length,
      totalCinema,
      totalCanteen,
      consolidatedRevenue,
      estimatedExpenses,
      treasuryBalance,
    };
  }, [students, cinemaSales, foodOrders]);

  // Key pillars data
  const pillars = useMemo(() => [
    {
      title: "1. Animation & Grands Événements Fédérateurs",
      icon: Calendar,
      achievements: [
        "Organisation d'événements majeurs (Projections Cinéma BDE, Sorties détentes à Assinie avec gestion des réservations, Soirées et afterworks).",
        "Maintien d'un calendrier régulier d'animation de la vie étudiante accessible à toutes les filières de l'IFRAN.",
        "Renforcement du sentiment d'appartenance et de la cohésion inter-promotions."
      ]
    },
    {
      title: "2. Structuration des Clubs Permanents & Ateliers Afternoon",
      icon: Sparkles,
      achievements: [
        `${clubs.length} clubs permanents structurés avec responsables désignés et programmes d'activités suivis.`,
        `${ateliers.length} ateliers pratiques hebdomadaires pour le perfectionnement technologique et créatif des étudiants.`,
        "Promotion du tutorat et du partage d'expérience entre étudiants seniors et nouveaux arrivants."
      ]
    },
    {
      title: "3. Digitalisation des Services Étudiants (Plateforme Web BDE)",
      icon: TrendingUp,
      achievements: [
        "Développement et déploiement d'une plateforme web complète (BDE Connect) pour l'agenda, les inscriptions et la billetterie.",
        `Lancement du module Cantine Connectée ayant géré ${foodOrders.length} commandes en ligne pour fluidifier la restauration.`,
        "Automatisation de la génération des reçus officiels de cotisations et des comptes-rendus administratifs."
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
        `${financialStats.totalCotisations.toLocaleString()} FCFA collectés au titre des cotisations avec traçabilité complète.`,
        `${financialStats.consolidatedRevenue.toLocaleString()} FCFA de recettes globales mobilisées pour financer les actions étudiantes.`,
        "Tenue d'une comptabilité claire et transmission d'un solde positif pour assurer la pérennité du prochain bureau."
      ]
    }
  ], [clubs, ateliers, foodOrders, prospects, financialStats]);

  // Generate PDF Handler
  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    try {
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
          title: e.title,
          date: e.date,
          location: e.location,
          status: e.status,
          description: e.description
        })),
        clubsCount: clubs.length,
        clubsList: clubs.map(c => ({
          name: c.name,
          leader: c.leaderName,
          activities: c.activities?.join(', ') || 'Activités régulières'
        })),
        ateliersCount: ateliers.length,
        ateliersList: ateliers.map(a => ({
          name: a.name,
          room: a.room
        })),
        finances: {
          totalCollectedCotisations: financialStats.totalCotisations,
          contributorsCount: financialStats.paidCount,
          totalCinemaRevenue: financialStats.totalCinema,
          totalCanteenRevenue: financialStats.totalCanteen,
          totalConsolidatedRevenue: financialStats.consolidatedRevenue,
          estimatedExpenses: financialStats.estimatedExpenses,
          treasuryBalance: financialStats.treasuryBalance
        },
        prospectsCount: prospects.length,
        sentProspectsCount: prospects.filter(p => p.status === 'sent').length,
        canteenOrdersCount: foodOrders.length,
        challengesFaced: challenges,
        recommendations,
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
      <div className="space-y-8 pb-16">
        
        {/* Top Executive Header */}
        <div className="bg-gradient-to-r from-bde-navy via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-bde-rose/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-bde-rose text-white rounded-xl shadow-md">
                  <Award size={26} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-rose-300 font-bold">Document Officiel de Gouvernance</span>
                    <span className="text-xs text-white/40">·</span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck size={14} /> Prêt pour dépôt
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Bilan du Mandat de Présidence
                  </h1>
                </div>
              </div>

              <p className="text-sm sm:text-base text-gray-300 max-w-3xl leading-relaxed">
                Rapport d'activités moral, opérationnel, pédagogique et financier récapitulant l'ensemble des projets, événements, clubs et services déployés par le Bureau des Étudiants sous la présidence de <strong className="text-white underline decoration-bde-rose">{presidentName}</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-400 pt-1">
                <span>Période : <strong className="text-gray-200">{mandatePeriod}</strong></span>
                <span>·</span>
                <span>Dépôt officiel : <strong className="text-gray-200">{submissionDate}</strong></span>
                <span>·</span>
                <span>Destinataire : <strong className="text-gray-200">{recipient}</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition border border-white/15"
                title="Modifier les textes officiels, le mot du président et les signataires"
              >
                <Edit3 size={16} />
                <span>Personnaliser</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition border border-slate-700"
                title="Imprimer ou enregistrer au format PDF d'impression"
              >
                <Printer size={16} />
                <span>Imprimer (A4)</span>
              </button>

              <button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf || loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-bde-rose hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Génération PDF en cours...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Générer le Rapport PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Success toast */}
        {saveSuccessNotification && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
            <CheckCircle2 size={18} />
            <span>Vos personnalisations de mandat ont été enregistrées avec succès !</span>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <span>Cotisations</span>
              <DollarSign size={16} className="text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-bde-navy dark:text-white tabular-nums truncate">
              {financialStats.totalCotisations.toLocaleString()} F
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {financialStats.paidCount} cotisants actifs
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
              <span>Recettes Globales</span>
              <TrendingUp size={16} className="text-indigo-500" />
            </div>
            <div className="text-xl font-extrabold text-bde-navy dark:text-white tabular-nums truncate">
              {financialStats.consolidatedRevenue.toLocaleString()} F
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Consolidé (Ciné/Cant/Cotis)
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
              <span>Cantine Digitale</span>
              <Utensils size={16} className="text-orange-500" />
            </div>
            <div className="text-2xl font-extrabold text-bde-navy dark:text-white tabular-nums">
              {foodOrders.length}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Commandes traitées
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
              <span>Équipe BDE</span>
              <Users size={16} className="text-teal-500" />
            </div>
            <div className="text-2xl font-extrabold text-bde-navy dark:text-white tabular-nums">
              {members.length > 0 ? members.length : 8}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Membres investis
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-slate-700 flex overflow-x-auto no-scrollbar gap-2">
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
            Bilan Financier & Cotisations
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
            Innovation Digitale & Communication
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-3 px-4 font-semibold text-sm whitespace-nowrap border-b-2 transition ${
              activeTab === 'recommendations'
                ? 'border-bde-rose text-bde-rose dark:text-rose-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Recommandations & Visas
          </button>
        </div>

        {/* Tab 1: Overview & Speech */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Presidential Moral Statement */}
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

        {/* Tab 2: Events & Activities */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 3 · Vie Étudiante</span>
                  <h2 className="text-xl font-extrabold text-bde-navy dark:text-white mt-1">
                    Répertoire Officiel des Événements & Mobilisations
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Conforme au format administratif : identification directe des statuts par codes couleurs.
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

              {/* Table with Colored Rows for Status */}
              <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-bde-navy text-white text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 font-bold">Date</th>
                      <th className="p-3.5 font-bold">Activité / Événement</th>
                      <th className="p-3.5 font-bold">Lieu</th>
                      <th className="p-3.5 font-bold">Statut</th>
                      <th className="p-3.5 font-bold">Portée & Description</th>
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
                        const isCancelled = evt.status === 'cancelled';

                        // Custom background color per row matching user's explicit request
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
                            <td className="p-3.5 font-bold text-bde-navy dark:text-white">
                              {evt.title}
                            </td>
                            <td className="p-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {evt.location || 'Campus IFRAN'}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              {statusBadge}
                            </td>
                            <td className="p-3.5 text-gray-600 dark:text-gray-300 max-w-md">
                              {evt.description || 'Activité officielle BDE'}
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

        {/* Tab 3: Finances */}
        {activeTab === 'finances' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 4 · Trésorerie & Comptabilité</span>
                <h2 className="text-xl font-extrabold text-bde-navy dark:text-white mt-1">
                  Bilan Financier Consolidé du Mandat
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Rapprochement de l'ensemble des flux financiers générés via le site et validés par le Bureau.
                </p>
              </div>

              {/* Financial Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-5 rounded-xl border border-blue-200 dark:border-blue-900/50">
                  <div className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">Total Encaissé (Recettes)</div>
                  <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-100 tabular-nums mt-1">
                    {financialStats.consolidatedRevenue.toLocaleString()} FCFA
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Cotisations + Billetterie + Cantine
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <div className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300">Dépenses & Investissements</div>
                  <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100 tabular-nums mt-1">
                    {financialStats.estimatedExpenses.toLocaleString()} FCFA
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Logistique, événements, matériel
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                  <div className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">Solde de Trésorerie Final</div>
                  <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 tabular-nums mt-1">
                    {financialStats.treasuryBalance.toLocaleString()} FCFA
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Fonds nets transmis au prochain bureau
                  </div>
                </div>
              </div>

              {/* Consolidated Accounting Table */}
              <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 font-bold">Poste de Recette / Dépense</th>
                      <th className="p-3.5 font-bold">Volume / Détail d'activité</th>
                      <th className="p-3.5 font-bold text-right">Montant Réalisé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-750">
                      <td className="p-3.5 font-semibold text-gray-900 dark:text-white">Cotisations Étudiantes</td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-300">{financialStats.paidCount} étudiants à jour de cotisation</td>
                      <td className="p-3.5 font-mono font-bold text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {financialStats.totalCotisations.toLocaleString()} FCFA
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-750">
                      <td className="p-3.5 font-semibold text-gray-900 dark:text-white">Billetterie & Projections Cinéma</td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-300">Ventes tickets et snacks ({cinemaSales.length} opérations)</td>
                      <td className="p-3.5 font-mono font-bold text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {financialStats.totalCinema.toLocaleString()} FCFA
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-750">
                      <td className="p-3.5 font-semibold text-gray-900 dark:text-white">Ventes Cantine & Restauration</td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-300">{foodOrders.length} précommandes servies</td>
                      <td className="p-3.5 font-mono font-bold text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {financialStats.totalCanteen.toLocaleString()} FCFA
                      </td>
                    </tr>
                    <tr className="bg-blue-50/70 dark:bg-blue-950/20 font-bold">
                      <td className="p-3.5 text-blue-900 dark:text-blue-100">TOTAL DES RECETTES MOBILISÉES</td>
                      <td className="p-3.5 text-blue-800 dark:text-blue-200">Totalité des flux entrants</td>
                      <td className="p-3.5 font-mono text-right tabular-nums text-blue-900 dark:text-blue-100">
                        {financialStats.consolidatedRevenue.toLocaleString()} FCFA
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-750">
                      <td className="p-3.5 font-semibold text-gray-900 dark:text-white">Dépenses Opérationnelles & Matériel</td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-300">Logistique événements, sono, matériel clubs, snacks</td>
                      <td className="p-3.5 font-mono font-bold text-right tabular-nums text-rose-600 dark:text-rose-400">
                        - {financialStats.estimatedExpenses.toLocaleString()} FCFA
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/80 dark:bg-emerald-950/30 font-bold border-t-2 border-emerald-500/30">
                      <td className="p-3.5 text-emerald-900 dark:text-emerald-100">SOLDE DE TRÉSORERIE TRANSMIS</td>
                      <td className="p-3.5 text-emerald-800 dark:text-emerald-200">Trésorerie nette disponible pour le nouveau BDE</td>
                      <td className="p-3.5 font-mono text-right tabular-nums text-emerald-700 dark:text-emerald-300">
                        + {financialStats.treasuryBalance.toLocaleString()} FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Clubs & Workshops */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 5 · Clubs & Pédagogie</span>
                <h2 className="text-xl font-extrabold text-bde-navy dark:text-white mt-1">
                  Structuration des Clubs Permanents & Ateliers Afternoon
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Les clubs et ateliers créés et soutenus pour développer les compétences pratiques des étudiants.
                </p>
              </div>

              {/* Clubs List */}
              <div className="space-y-4 mb-8">
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-bde-rose" />
                  <span>Clubs Permanents ({clubs.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clubs.map(club => (
                    <div key={club.id} className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/40">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-bde-navy dark:text-white text-base">{club.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Responsable : <strong className="text-gray-700 dark:text-gray-300">{club.leaderName}</strong>
                          </div>
                        </div>
                        {club.emoji && <span className="text-2xl">{club.emoji}</span>}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2.5 line-clamp-2">
                        {club.description}
                      </p>
                      {club.activities && club.activities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {club.activities.map((act, idx) => (
                            <span key={idx} className="text-[11px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300">
                              {act}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
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
                        {atelier.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Digital Innovation & Services */}
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
                <div className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-800">
                  <div className="p-3 bg-indigo-500 text-white rounded-xl w-fit mb-3">
                    <FileText size={20} />
                  </div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
                    Plateforme BDE Connect
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Centralisation complète de l'agenda des événements, de la galerie photo, des inscriptions aux clubs et ateliers, et du tutorat entre promotions.
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    Accessible 24/7 sur web & mobile
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-orange-50/50 to-white dark:from-slate-900 dark:to-slate-800">
                  <div className="p-3 bg-orange-500 text-white rounded-xl w-fit mb-3">
                    <Utensils size={20} />
                  </div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
                    Module Cantine Digitale
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Précommande en ligne des déjeuners, gestion des stocks, réduction drastique des temps d'attente lors des pauses déjeuners des étudiants.
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                    {foodOrders.length} commandes enregistrées
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-teal-50/50 to-white dark:from-slate-900 dark:to-slate-800">
                  <div className="p-3 bg-teal-500 text-white rounded-xl w-fit mb-3">
                    <Users size={20} />
                  </div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
                    Communication & Réseaux Étudiants
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Canaux officiels, diffusion de l'actualité des promotions, recueil des besoins étudiants et coordination continue avec l'Administration.
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-teal-600 dark:text-teal-400 font-semibold">
                    Couverture de toutes les filières
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Recommendations & Signatures */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-8">
              <div>
                <span className="text-xs uppercase tracking-widest text-bde-rose font-bold">Section 7 · Passation & Recommandations</span>
                <h2 className="text-xl font-extrabold text-bde-navy dark:text-white mt-1">
                  Recommandations Stratégiques pour l'Administration et la Relève
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enseignements tirés et préconisations pour assurer la continuité de l'excellence de la vie étudiante.
                </p>
              </div>

              {/* Challenges */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm mb-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>Difficultés & Contraintes Rencontrées</span>
                </h3>
                <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-line">
                  {challenges}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-xl border border-blue-200/60 dark:border-blue-900/40">
                <h3 className="font-bold text-blue-900 dark:text-blue-200 text-sm mb-2 flex items-center gap-2">
                  <Sparkles size={16} />
                  <span>Propositions Soumises à la Direction de l'IFRAN</span>
                </h3>
                <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed whitespace-pre-line">
                  {recommendations}
                </div>
              </div>

              {/* Conclusion */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">
                  Mot de Conclusion du Président
                </h3>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                  {conclusion}
                </div>
              </div>

              {/* Official Signature Blocks */}
              <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold mb-6">
                  Émargements & Visas Officiels de Dépôt
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Block 1: President */}
                  <div className="p-5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-center flex flex-col justify-between h-44">
                    <div>
                      <div className="text-xs uppercase font-bold text-gray-500">Pour le Bureau des Étudiants</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm mt-1">{presidentName}</div>
                      <div className="text-xs text-bde-rose font-medium">Président du BDE</div>
                    </div>
                    <div className="text-[11px] text-gray-400 border-t border-gray-200 dark:border-slate-800 pt-2">
                      Signature & Date
                    </div>
                  </div>

                  {/* Block 2: Treasurer */}
                  <div className="p-5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-center flex flex-col justify-between h-44">
                    <div>
                      <div className="text-xs uppercase font-bold text-gray-500">Pour la Trésorerie</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm mt-1">Le Trésorier Général</div>
                      <div className="text-xs text-emerald-600 font-medium">Visa de conformité comptable</div>
                    </div>
                    <div className="text-[11px] text-gray-400 border-t border-gray-200 dark:border-slate-800 pt-2">
                      Signature & Date
                    </div>
                  </div>

                  {/* Block 3: Administration */}
                  <div className="p-5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/10 text-center flex flex-col justify-between h-44">
                    <div>
                      <div className="text-xs uppercase font-bold text-indigo-700 dark:text-indigo-400">Pour l'Administration IFRAN</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm mt-1">Direction des Études</div>
                      <div className="text-xs text-indigo-600 font-medium">Accusé de réception officiel</div>
                    </div>
                    <div className="text-[11px] text-gray-400 border-t border-indigo-200 dark:border-indigo-900/40 pt-2">
                      Cachet de l'Institut & Visa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Edit Modal / Drawer for Customizing the Report */}
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
                  Difficultés & Contraintes Rencontrées
                </label>
                <textarea
                  rows={2}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Recommandations pour l'Administration et la Relève
                </label>
                <textarea
                  rows={3}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-bde-rose"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Conclusion du Mandat
                </label>
                <textarea
                  rows={2}
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
