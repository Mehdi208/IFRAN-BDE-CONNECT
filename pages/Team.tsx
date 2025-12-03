import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dataService } from '../services/dataService';
import { Member } from '../types';
import { MessageCircle } from 'lucide-react';

// Composant pour la carte "fantôme" (Skeleton)
const SkeletonCard = () => (
  <div className="w-full sm:max-w-xs bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-6 text-center border-t-4 border-gray-200">
      <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
    </div>
  </div>
);

const Team = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true); // État de chargement

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await dataService.fetchMembers();
      setMembers(data);
      setLoading(false);
    };
    load();
  }, []);
  
  // Hook pour déclencher les animations au scroll
  useEffect(() => {
    if (loading) return; // Ne pas activer l'observateur tant que les données chargent

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { 
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    });

    const hiddenElements = document.querySelectorAll('.reveal');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, [loading]); // Se redéclenche quand le chargement est terminé

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 reveal active"> {/* 'active' pour que le titre apparaisse toujours */}
          <h1 className="text-4xl font-bold text-bde-navy mb-4">Le Bureau 2025-2026</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Une équipe dévouée au service des étudiants.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {loading ? (
            Array.from({ length: 8 }).map((_, idx) => <SkeletonCard key={idx} />)
          ) : (
            members.map((member, idx) => (
              <div 
                key={member.id} 
                className="w-full sm:max-w-xs bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group reveal"
                style={{ transitionDelay: `${idx * 100}ms` }} // Délai plus lent pour un effet doux
              >
                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src={member.photoUrl} 
                    alt={member.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bde-navy/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                     <a 
                       href={`https://wa.me/${member.whatsapp}`} 
                       target="_blank"
                       rel="noreferrer"
                       className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                     >
                       <MessageCircle size={16} /> WhatsApp
                     </a>
                  </div>
                </div>
                <div className="p-6 text-center border-t-4 border-bde-rose">
                  <h3 className="font-bold text-xl text-gray-800 mb-1">{member.name}</h3>
                  <p className="text-sm text-bde-rose font-medium uppercase tracking-wide">{member.role}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Team;