import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Calendar, 
  FileText, 
  LogOut,
  UserCheck
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/admin/contributions', icon: Wallet, label: 'Cotisations' },
    { path: '/admin/clubs', icon: Users, label: 'Clubs' },
    { path: '/admin/events', icon: Calendar, label: 'Événements' },
    { path: '/admin/members', icon: UserCheck, label: 'Membres BDE' },
    { path: '/admin/documents', icon: FileText, label: 'Documents' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bde-navy text-white hidden md:flex flex-col fixed h-full">
        <div className="p-6 border-b border-white/10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-3 text-2xl font-bold text-white border-2 border-bde-rose">
            BDE
          </div>
          <h1 className="text-xl font-bold text-bde-rose">Admin Panel</h1>
          <p className="text-xs text-gray-400 mt-1">Espace de gestion</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-bde-rose text-white shadow-md' 
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
             <span className="font-bold text-bde-navy text-lg">BDE Admin</span>
          </div>
          <button onClick={handleLogout} className="text-red-500"><LogOut size={20}/></button>
        </div>
        
        {/* Children */}
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Nav Bottom (Optional, simplified for now) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bde-navy p-2 flex justify-around z-50">
          {navItems.slice(0, 5).map(item => (
             <Link key={item.path} to={item.path} className="p-2 text-white">
                <item.icon size={20} />
             </Link>
          ))}
      </div>
    </div>
  );
};

export default AdminLayout;