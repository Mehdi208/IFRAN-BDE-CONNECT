
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, Users, GraduationCap, UserPlus } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
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
              
              {/* Logo Circle */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-bde-rose/50 transition-transform group-hover:scale-105">
                {!logoError ? (
                    <img 
                        src="/logo.png?v=4" 
                        alt="Logo BDE" 
                        className="w-full h-full object-cover"
                        onError={() => setLogoError(true)}
                    />
                ) : (
                    <span className="text-bde-navy font-bold text-xs">BDE</span>
                )}
              </div>

              {/* Text Branding with Red Line */}
              <div className="border-l-2 border-bde-rose pl-3 py-1">
                <span className="text-white font-extrabold text-xl sm:text-2xl tracking-wider uppercase block leading-none group-hover:text-gray-200 transition-colors">
                  BDE IFRAN
                </span>
                <span className="text-bde-rose font-bold text-sm tracking-[0.2em] uppercase block leading-none mt-1 group-hover:text-white transition-colors">
                  CONNECT
                </span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-2 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-2 group
                  ${isActive(link.path) 
                    ? 'text-white' 
                    : 'text-gray-300 hover:text-white'
                  }`}
              >
                {link.icon && <link.icon size={16} className={`transition-transform group-hover:-translate-y-0.5 ${isActive(link.path) ? 'text-bde-rose' : 'text-gray-400 group-hover:text-bde-rose'}`} />}
                {link.label}
                
                {/* Underline Slide Animation */}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-bde-rose transform origin-left transition-transform duration-300 ease-out
                  ${isActive(link.path) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}
                `}></span>
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-bde-navy border-t border-white/10 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-3 rounded-md text-base font-medium flex items-center gap-3 transition-all
                  ${isActive(link.path)
                    ? 'bg-white/10 text-white border-l-4 border-bde-rose pl-2'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {link.icon && <link.icon size={18} className={isActive(link.path) ? 'text-bde-rose' : ''} />}
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
