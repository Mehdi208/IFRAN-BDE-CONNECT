import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, Users, GraduationCap, UserPlus } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { path: '/', label: 'Accueil', icon: null },
    { path: '/calendar', label: 'Agenda', icon: Calendar },
    { path: '/clubs', label: 'Clubs', icon: Users },
    { path: '/tutoring', label: 'Tutorats', icon: GraduationCap },
    { path: '/team', label: 'Le Bureau', icon: UserPlus },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-bde-navy text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-4 group">
              {/* Text Only Branding */}
              <div className="border-l-4 border-bde-rose pl-3 py-1">
                <span className="text-white font-extrabold text-xl sm:text-2xl tracking-wider uppercase block leading-none">
                  BDE IFRAN
                </span>
                <span className="text-bde-rose font-bold text-sm tracking-[0.2em] uppercase block leading-none mt-1">
                  CONNECT
                </span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2
                  ${isActive(link.path) 
                    ? 'bg-bde-rose text-white' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {link.icon && <link.icon size={16} />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-bde-navy border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2
                  ${isActive(link.path)
                    ? 'bg-bde-rose text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {link.icon && <link.icon size={18} />}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;