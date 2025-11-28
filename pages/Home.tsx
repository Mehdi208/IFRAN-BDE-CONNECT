
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowRight, Star, Heart, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {

  // Hook pour déclencher les animations au scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { 
      threshold: 0.1, // Déclenche quand 10% de l'élément est visible
      rootMargin: "0px 0px -50px 0px" // Décale légèrement la zone de déclenchement
    });

    const hiddenElements = document.querySelectorAll('.reveal');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section avec animation Aurora */}
      {/* Modification ici : remplacement du padding fixe (py-24) par une hauteur calculée (min-h-[calc(100vh-5rem)]) */}
      <section className="relative overflow-hidden flex items-center justify-center min-h-[calc(100vh-5rem)] bg-gradient-to-r from-bde-navy via-[#1e3a6f] to-bde-navy bg-[length:200%_auto] animate-gradient-x text-white">
        
        {/* Background Overlay Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse-slow pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-bde-rose opacity-20 rounded-full blur-[120px] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0s' }}>
            <div className="animate-float">
              Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-bde-rose to-pink-400 inline-block">BDE Connect</span>
            </div>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-10 font-light max-w-2xl mx-auto animate-fade-in-up opacity-0 leading-relaxed" style={{ animationDelay: '0.3s' }}>
            <div className="animate-float-delayed">
              La plateforme officielle du Bureau des Étudiants de l'IFRAN Côte d'Ivoire. 
              <span className="block mt-2 text-white font-medium">Ensemble, construisons l'avenir.</span>
            </div>
          </p>
          
          {/* Correction : Séparation des animations pour éviter le conflit d'opacité */}
          <div className="w-full animate-fade-in-up opacity-0" style={{ animationDelay: '0.6s' }}>
             {/* Changement ici: animate-float-delayed au lieu de animate-float-slow pour synchroniser avec le texte */}
             <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full animate-float-delayed">
                <Link to="/calendar" className="group relative overflow-hidden bg-bde-rose hover:bg-rose-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 hover:scale-105 transform hover:-translate-y-1">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine"></div>
                    <span>Voir l'Agenda</span> <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link to="/clubs" className="group bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg transition-all backdrop-blur-md hover:scale-105 transform hover:-translate-y-1 border border-white/20 hover:border-white/40">
                    Découvrir les Clubs
                </Link>
             </div>
          </div>

        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl font-bold text-bde-navy mb-4">Notre Vision 2025-2026</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-bde-navy via-bde-rose to-bde-navy mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-default group reveal" style={{transitionDelay: '0ms'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 text-bde-navy rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner border border-blue-200">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold text-bde-navy mb-3 group-hover:text-blue-600 transition-colors">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                Promouvoir l'excellence technologique et l'entrepreneuriat au sein du campus à travers des hackathons et des ateliers.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-default group reveal" style={{transitionDelay: '150ms'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-rose-50 to-rose-100 text-bde-rose rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner border border-rose-200">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold text-bde-navy mb-3 group-hover:text-bde-rose transition-colors">Cohésion</h3>
              <p className="text-gray-600 leading-relaxed">
                Renforcer les liens entre les étudiants de toutes les filières par des événements sociaux, culturels et sportifs inclusifs.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-default group reveal" style={{transitionDelay: '300ms'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner border border-purple-200">
                <Star size={32} />
              </div>
              <h3 className="text-xl font-bold text-bde-navy mb-3 group-hover:text-purple-600 transition-colors">Réussite</h3>
              <p className="text-gray-600 leading-relaxed">
                Accompagner chaque étudiant vers le succès académique grâce à notre programme de tutorat et de mentorat par les pairs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center reveal">
          <h2 className="text-3xl font-bold text-bde-navy mb-6">Besoin d'aide ou d'information ?</h2>
          <p className="text-gray-600 mb-10 text-lg leading-relaxed">
            Le BDE est là pour vous écouter. N'hésitez pas à contacter un membre du bureau ou à rejoindre les groupes officiels pour ne rien rater.
          </p>
          <a href="https://chat.whatsapp.com/CUkngAoKWf88noZiO3EQJQ" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:shadow-green-500/40">
            Rejoindre la Communauté
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
