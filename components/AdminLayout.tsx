import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Calendar, 
  FileText, 
  LogOut,
  UserCheck,
  Menu,
  X,
  Sparkles,
  UtensilsCrossed,
  Image as ImageIcon,
  Sun,
  Moon,
  Award,
  Shirt,
  Download,
  Share,
} from 'lucide-react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { isPwaInstalled, installPwa } from '../services/pwaService';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isPwaInstalled());
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('adminDarkMode');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('adminDarkMode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Synchronize PWA installation state
  useEffect(() => {
    const checkStatus = () => {
      setIsInstalled(isPwaInstalled());
    };
    checkStatus();
    window.addEventListener('pwa-installed', checkStatus);
    window.addEventListener('pwa-prompt-ready', checkStatus);
    window.addEventListener('appinstalled', checkStatus);

    return () => {
      window.removeEventListener('pwa-installed', checkStatus);
      window.removeEventListener('pwa-prompt-ready', checkStatus);
      window.removeEventListener('appinstalled', checkStatus);
    };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling when mobile sidebar is open & support Escape key
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileSidebarOpen]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      console.warn("Erreur déconnexion Firebase:", e);
    }
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const handleInstallApp = async () => {
    const result = await installPwa();
    if (result === 'accepted') {
      setIsInstalled(true);
    } else if (result === 'ios') {
      setShowIosGuide(true);
    } else if (result === 'manual') {
      setShowManualGuide(true);
    }
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/admin/polos', icon: Shirt, label: 'Polos & Stocks' },
    { path: '/admin/mandate-report', icon: Award, label: 'Bilan de Mandat' },
    { path: '/admin/contributions', icon: Wallet, label: 'Cotisations' },
    { path: '/admin/canteen', icon: UtensilsCrossed, label: 'Gestion Cantine' },
    { path: '/admin/clubs', icon: Users, label: 'Clubs Permanents' },
    { path: '/admin/ateliers', icon: Sparkles, label: 'Ateliers Afternoon' },
    { path: '/admin/events', icon: Calendar, label: 'Événements' },
    { path: '/admin/gallery', icon: ImageIcon, label: 'Galerie' },
    { path: '/admin/members', icon: UserCheck, label: 'Membres BDE' },
    { path: '/admin/documents', icon: FileText, label: 'Documents' },
  ];
  
  const currentPage = navItems.find(item => item.path === location.pathname);

  const SidebarContent: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => (
    <>
      <div className="relative p-6 border-b border-white/10 dark:border-slate-800 flex flex-col items-center text-center">
        {/* Bouton pour fermer la sidebar sur mobile */}
        {isMobile && (
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            title="Fermer le menu"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        )}

        <div className="w-16 h-16 bg-white/10 dark:bg-slate-800/80 rounded-full flex items-center justify-center mb-3 text-2xl font-bold text-white border-2 border-bde-rose overflow-hidden shadow-lg shadow-rose-900/20">
           {!logoError ? (
               <img src="/logo.png?v=4" alt="BDE" className="w-full h-full object-cover" onError={() => setLogoError(true)} />
           ) : <span className="text-white font-bold text-xl">BDE</span>}
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
          <span>BDE</span>
          <span className="text-bde-rose">Admin</span>
        </h1>
        <span className="text-[11px] text-slate-400 font-medium mt-0.5">IFRAN Côte d'Ivoire</span>
      </div>
      
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => {
                if (isMobile) setIsMobileSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                isActive 
                  ? 'bg-bde-rose text-white shadow-lg shadow-rose-900/30 font-bold translate-x-1' 
                  : 'text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <item.icon size={19} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 dark:border-slate-800 space-y-2">
        {/* Bouton permanent pour installer la PWA (disparaît une fois installée) */}
        {!isInstalled && (
          <button
            type="button"
            onClick={handleInstallApp}
            className="flex items-center justify-between px-3.5 py-2.5 w-full text-left text-white bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 rounded-xl transition-all shadow-sm group active:scale-95"
            title="Installer l'application BDE IFRAN sur cet appareil"
          >
            <div className="flex items-center gap-3">
              <Download size={19} className="text-bde-rose group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-xs font-bold text-white">Installer l'application</span>
            </div>
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-bde-rose text-white shadow-sm shrink-0">
              App
            </span>
          </button>
        )}

        <button 
          onClick={toggleDarkMode} 
          className="flex items-center justify-between px-3.5 py-2.5 w-full text-left text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          title="Basculer entre Mode Sombre et Mode Clair"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-indigo-300" />}
            <span className="text-xs font-semibold">{isDarkMode ? 'Mode Sombre' : 'Mode Clair'}</span>
          </div>
          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30'}`}>
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
        </button>

        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3 px-3.5 py-2.5 w-full text-left text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs font-semibold"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-[#0a0f1d] text-slate-100' : 'bg-slate-100/90 text-slate-900'} flex`}>
      {/* Desktop Sidebar (Permanent) */}
      <aside className={`w-64 ${isDarkMode ? 'bg-[#0d1527] border-r border-slate-800/80 shadow-2xl' : 'bg-bde-navy text-white shadow-xl'} text-white hidden md:flex flex-col fixed h-full z-40`}>
        <SidebarContent isMobile={false} />
      </aside>

      {/* Mobile Drawer & Backdrop */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop (Dark overlay with blur) */}
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <aside className={`relative w-72 max-w-[82vw] ${isDarkMode ? 'bg-[#0d1527] border-r border-slate-800' : 'bg-bde-navy'} text-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250`}>
            <SidebarContent isMobile={true} />
          </aside>

          {/* Clickable Area on the Right to close immediately */}
          <div
            className="flex-1 h-full z-10 cursor-pointer"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8 overflow-y-auto min-h-screen">
        {/* Mobile Top Header */}
        <div className={`md:hidden mb-6 flex justify-between items-center ${isDarkMode ? 'bg-[#131b2e] border border-slate-800 text-white' : 'bg-white border border-gray-200 text-bde-navy'} p-4 rounded-xl shadow-sm sticky top-0 z-30 backdrop-blur-md`}>
          <button 
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)} 
            className="p-1.5 rounded-lg text-inherit hover:bg-white/10 dark:hover:bg-slate-800 transition-colors"
            title="Ouvrir le menu"
            aria-label="Ouvrir le menu"
          >
            <Menu size={24} />
          </button>
          <h2 className="font-extrabold text-inherit text-base">{currentPage?.label || 'Administration'}</h2>
          <div className="flex items-center gap-2">
            {!isInstalled && (
              <button 
                onClick={handleInstallApp}
                className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-bde-rose hover:bg-rose-500/25 transition-colors"
                title="Installer l'application BDE IFRAN"
                aria-label="Installer l'application"
              >
                <Download size={20} />
              </button>
            )}
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-amber-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Basculer le mode sombre"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogout} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
              <LogOut size={20}/>
            </button>
          </div>
        </div>
        <div className="animate-fade-in">{children}</div>
      </main>

      {/* Guide d'installation sur iPhone / Safari iOS */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-bde-rose">
                <Share size={18} />
                <span>Installer sur iPhone / iPad</span>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pour ajouter l'application BDE IFRAN directement sur votre écran d'accueil :
            </p>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-200 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <li>Appuyez sur le bouton <strong>Partager</strong> en bas de Safari (<Share size={13} className="inline text-blue-400" />).</li>
              <li>Faites défiler et appuyez sur <strong>« Sur l'écran d'accueil »</strong> (icône ➕).</li>
              <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
            </ol>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-bde-rose text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              C'est compris !
            </button>
          </div>
        </div>
      )}

      {/* Guide d'installation sur Ordinateur / PC / Mac */}
      {showManualGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-bde-rose">
                <Download size={18} />
                <span>Installer sur votre Ordinateur</span>
              </div>
              <button onClick={() => setShowManualGuide(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pour installer l'application BDE IFRAN sur votre PC ou Mac :
            </p>
            <div className="text-xs text-slate-200 bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5 leading-relaxed">
              Dans la barre d'adresse de votre navigateur (Chrome, Edge ou Brave), cliquez sur la petite icône <strong>« Installer BDE IFRAN »</strong> située tout à droite à côté de l'étoile des favoris.
            </div>
            <button
              onClick={() => setShowManualGuide(false)}
              className="w-full py-2.5 rounded-xl bg-bde-rose text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
