import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Shield, MessageCircle, ExternalLink } from 'lucide-react';

const Footer = () => {
  const usefulLinks = [
    { label: 'La COMMU (Général)', url: 'https://chat.whatsapp.com/CUkngAoKWf88noZiO3EQJQ' },
    { label: 'Questions & Suggestions', url: 'https://chat.whatsapp.com/KooXaVKKxTX0sHMHYZlW8U?mode=hqrt1' },
    { label: 'Groupe des Clubs', url: 'https://chat.whatsapp.com/JnLr0PK1aoa9LZJmTo45BB?mode=hqrt1' },
    { label: 'Annonces Officielles', url: 'https://chat.whatsapp.com/F6SHqIs5ZvV7CLPTBlNHzN?mode=hqrt1' },
    { label: 'Groupe Tutorats', url: 'https://chat.whatsapp.com/JsE5unrSsXJ22lcESz3Jof?mode=hqrt1' },
  ];

  return (
    <footer className="bg-bde-navy text-gray-300 mt-auto border-t border-bde-rose/30 relative overflow-hidden">
       {/* Decorative top glow */}
       <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-bde-rose to-transparent opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          
          {/* COL 1: Info BDE */}
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-black text-white tracking-tighter mb-6">
              BDE <span className="text-bde-rose">IFRAN</span>
            </h2>
            <p className="text-sm leading-relaxed text-gray-400 mb-6 max-w-sm text-center">
              Le Bureau des Étudiants s'engage à dynamiser la vie étudiante, favoriser l'entraide et promouvoir l'excellence.
              <br />
              <span className="text-white font-medium mt-2 block">Vision 2025-2026.</span>
            </p>
            <a 
              href="https://maps.app.goo.gl/12mRGf3kFN6ddRW78"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 hover:border-bde-rose/50 transition-colors group"
            >
              <MapPin size={16} className="text-bde-rose group-hover:scale-110 transition-transform" />
              <span>Campus IFRAN, Abidjan</span>
            </a>
          </div>

          {/* COL 2: Navigation */}
          <div className="flex flex-col items-center">
            <h3 className="text-white text-lg font-bold mb-6 flex items-center justify-center gap-2">
               Navigation Rapide
            </h3>
            <ul className="space-y-3 w-full max-w-xs flex flex-col items-center">
                <li className="w-full">
                  <Link to="/calendar" className="block text-center hover:text-bde-rose transition-colors py-1 hover:scale-105 transform duration-200">
                    Agenda des activités
                  </Link>
                </li>
                <li className="w-full">
                  <Link to="/clubs" className="block text-center hover:text-bde-rose transition-colors py-1 hover:scale-105 transform duration-200">
                    Les Clubs étudiants
                  </Link>
                </li>
                <li className="w-full">
                  <Link to="/team" className="block text-center hover:text-bde-rose transition-colors py-1 hover:scale-105 transform duration-200">
                    Membres du Bureau
                  </Link>
                </li>
                <li className="w-full">
                  <Link to="/tutoring" className="block text-center hover:text-bde-rose transition-colors py-1 hover:scale-105 transform duration-200">
                    Programme de Tutorat
                  </Link>
                </li>
            </ul>
          </div>

          {/* COL 3: WhatsApp Links */}
          <div className="flex flex-col items-center">
            <h3 className="text-white text-lg font-bold mb-6 flex items-center justify-center gap-2">
               <MessageCircle size={20} className="text-green-500" />
               Communautés WhatsApp
            </h3>
            <div className="flex flex-col gap-3 w-full max-w-xs">
               {usefulLinks.map((link, idx) => (
                 <a 
                   key={idx} 
                   href={link.url}
                   target="_blank"
                   rel="noopener noreferrer" 
                   className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 hover:text-white transition group border border-transparent hover:border-green-500/30 w-full"
                 >
                   <span className="text-sm font-medium flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                     <span className="truncate">{link.label}</span>
                   </span>
                   <ExternalLink size={14} className="text-gray-500 group-hover:text-green-400 transition-colors shrink-0" />
                 </a>
               ))}
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p className="text-center md:text-left">&copy; {new Date().getFullYear()} BDE IFRAN. Tous droits réservés.</p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <a 
                href="https://wa.me/2250789609672" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 group bg-black/20 px-3 py-1.5 rounded-full hover:bg-black/40 transition"
            >
                <span className="text-gray-400 group-hover:text-white transition-colors">Créé par</span>
                <span className="shiny-effect ml-1">Méhdi Traoré</span>
            </a>

            <Link to="/login" className="flex items-center gap-1 text-gray-600 hover:text-bde-rose transition">
                <Shield size={12} />
                <span className="">Accès Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;