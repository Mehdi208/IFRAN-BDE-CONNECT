
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
  Moon
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
    { path: '/admin/contributions', icon: Wallet, label: 'Cotisations' },
    { path: '/admin/prospects', icon: Send, label: 'Relances WhatsApp' },
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
      <div className="p-6 border-b border-white/10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-3 text-2xl font-bold text-white border-2 border-bde-rose overflow-hidden">
           {!logoError ? (
               <img src="/logo.png?v=4" alt="BDE" className="w-full h-full object-cover" onError={() => setLogoError(true)} />
           ) : <span className="text-white font-bold text-xl">BDE</span>}
        </div>
        <h1 className="text-xl font-bold text-bde-rose">Admin Panel</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-bde-rose text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}>
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button 
          onClick={toggleDarkMode} 
          className="flex items-center justify-between px-4 py-3 w-full text-left text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
          title="Basculer entre Mode Sombre et Mode Clair"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-300" />}
            <span className="font-medium">{isDarkMode ? 'Mode Sombre' : 'Mode Clair'}</span>
          </div>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-amber-400/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-200'}`}>
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
        </button>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors">
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-gray-100 text-gray-900'} flex`}>
      <aside className="w-64 bg-bde-navy text-white hidden md:flex flex-col fixed h-full z-50"><SidebarContent /></aside>
      <div className={`fixed inset-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <aside className="w-64 bg-bde-navy text-white flex flex-col h-full"><SidebarContent /></aside>
      </div>
      {isMobileSidebarOpen && <div onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden"></div>}
      <main className="flex-1 md:ml-64 p-4 sm:p-8 overflow-y-auto min-h-screen">
        <div className="md:hidden mb-6 flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm sticky top-0 z-30">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="text-bde-navy dark:text-white"><Menu size={24} /></button>
          <h2 className="font-bold text-bde-navy dark:text-white text-lg">{currentPage?.label || 'Admin'}</h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleDarkMode} 
              className="p-2 text-gray-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Basculer le mode sombre"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogout} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"><LogOut size={20}/></button>
          </div>
        </div>
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
