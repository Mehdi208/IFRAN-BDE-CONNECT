import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowRight, Star, Heart, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-bde-navy text-white py-24 lg:py-32 relative overflow-hidden flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-bde-rose opacity-10 rounded-full blur-[100px] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up">
            Bienvenue sur <span className="text-bde-rose inline-block">BDE Connect</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-10 font-light max-w-2xl mx-auto animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
            La plateforme officielle du Bureau des Étudiants de l'IFRAN Côte d'Ivoire. 
            <span className="block mt-2 text-white font-medium">Ensemble, construisons l'avenir.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/calendar" className="bg-bde-rose hover:bg-rose-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 hover:scale-105 transform">
              Voir l'Agenda <ArrowRight size={20} />
            </Link>
            <Link to="/clubs" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg transition-all backdrop-blur-sm hover:scale-105 transform border border-white/10">
              Découvrir les Clubs
            </Link>
          </div>

        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl font-bold text-bde-navy mb-4">Notre Vision 2025-2026</h2>
            <div className="w-24 h-1.5 bg-bde-rose mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-default group animate-on-scroll" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 bg-blue-100 text-bde-navy rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold text-bde-navy mb-3">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                Promouvoir l'excellence technologique et l'entrepreneuriat au sein du campus à travers des hackathons et des ateliers.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-default group animate-on-scroll" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-rose-100 text-bde-rose rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold text-bde-navy mb-3">Cohésion</h3>
              <p className="text-gray-600 leading-relaxed">
                Renforcer les liens entre les étudiants de toutes les filières par des événements sociaux, culturels et sportifs inclusifs.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-default group animate-on-scroll" style={{animationDelay: '0.3s'}}>
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <Star size={32} />
              </div>
              <h3 className="text-xl font-bold text-bde-navy mb-3">Réussite</h3>
              <p className="text-gray-600 leading-relaxed">
                Accompagner chaque étudiant vers le succès académique grâce à notre programme de tutorat et de mentorat par les pairs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center animate-on-scroll">
          <h2 className="text-3xl font-bold text-bde-navy mb-6">Besoin d'aide ou d'information ?</h2>
          <p className="text-gray-600 mb-10 text-lg leading-relaxed">
            Le BDE est là pour vous écouter. N'hésitez pas à contacter un membre du bureau ou à rejoindre les groupes officiels pour ne rien rater.
          </p>
          <a href="https://chat.whatsapp.com/CUkngAoKWf88noZiO3EQJQ" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-green-500/20 transition-transform hover:scale-105">
            Rejoindre la Communauté
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;