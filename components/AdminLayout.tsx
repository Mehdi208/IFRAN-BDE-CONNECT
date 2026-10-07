
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
  GraduationCap,
  Sparkles,
  UtensilsCrossed,
  Image as ImageIcon,
  Send,
  Sun,
  Moon,
  Award
} from 'lucide-react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('adminDarkMode');
    return saved !== null ? saved === 'true' : true; // default to dark mode for sleek admin UI
  });

  useEffect(() => {
    localStorage.setItem('adminDarkMode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
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

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/10 dark:border-slate-800 flex flex-col items-center text-center">
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
      <aside className={`w-64 ${isDarkMode ? 'bg-[#0d1527] border-r border-slate-800/80 shadow-2xl' : 'bg-bde-navy text-white shadow-xl'} text-white hidden md:flex flex-col fixed h-full z-50`}>
        <SidebarContent />
      </aside>

      <div className={`fixed inset-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <aside className={`w-64 ${isDarkMode ? 'bg-[#0d1527] border-r border-slate-800' : 'bg-bde-navy'} text-white flex flex-col h-full shadow-2xl`}>
          <SidebarContent />
        </aside>
      </div>

      {isMobileSidebarOpen && <div onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"></div>}

      <main className="flex-1 md:ml-64 p-4 sm:p-8 overflow-y-auto min-h-screen">
        <div className={`md:hidden mb-6 flex justify-between items-center ${isDarkMode ? 'bg-[#131b2e] border border-slate-800 text-white' : 'bg-white border border-gray-200 text-bde-navy'} p-4 rounded-xl shadow-sm sticky top-0 z-30 backdrop-blur-md`}>
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-1 text-inherit">
            <Menu size={24} />
          </button>
          <h2 className="font-extrabold text-inherit text-base">{currentPage?.label || 'Administration'}</h2>
          <div className="flex items-center gap-2">
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
    </div>
  );
};

export default AdminLayout;
