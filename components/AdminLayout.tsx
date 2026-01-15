
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
  Sparkles
} from 'lucide-react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    { path: '/admin/clubs', icon: Users, label: 'Clubs Permanents' },
    { path: '/admin/ateliers', icon: Sparkles, label: 'Ateliers Afternoon' },
    { path: '/admin/events', icon: Calendar, label: 'Événements' },
    { path: '/admin/mentors', icon: GraduationCap, label: 'Tutorats' },
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

      <div className="p-4 border-t border-white/10">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors">
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-bde-navy text-white hidden md:flex flex-col fixed h-full z-50"><SidebarContent /></aside>
      <div className={`fixed inset-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <aside className="w-64 bg-bde-navy text-white flex flex-col h-full"><SidebarContent /></aside>
      </div>
      {isMobileSidebarOpen && <div onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden"></div>}
      <main className="flex-1 md:ml-64 p-4 sm:p-8 overflow-y-auto">
        <div className="md:hidden mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-0 z-30">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="text-bde-navy"><Menu size={24} /></button>
          <h2 className="font-bold text-bde-navy text-lg">{currentPage?.label || 'Admin'}</h2>
          <button onClick={handleLogout} className="text-red-500"><LogOut size={20}/></button>
        </div>
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
