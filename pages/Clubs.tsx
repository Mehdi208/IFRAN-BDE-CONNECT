import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dataService } from '../services/dataService';
import { Club } from '../types';
import { MessageCircle, Users } from 'lucide-react';

const Clubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    const load = async () => setClubs(await dataService.fetchClubs());
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-bde-navy mb-4">Vie Associative</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Développez vos talents et vos passions en rejoignant l'un de nos clubs dynamiques.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {clubs.map((club, idx) => (
            <div 
              key={club.id} 
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 flex flex-col animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="bg-blue-50 group-hover:bg-bde-navy transition-colors duration-300 p-4 rounded-xl shadow-inner">
                  <Users className="text-bde-navy group-hover:text-white transition-colors duration-300 w-8 h-8" />
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Actif</span>
              </div>
              
              <h2 className="text-2xl font-bold text-bde-navy mb-3 group-hover:text-bde-rose transition-colors">{club.name}</h2>
              <p className="text-gray-600 mb-6 flex-1">{club.description}</p>
              
              <div className="space-y-4">
                <div className="bg-gray-50 group-hover:bg-white border border-transparent group-hover:border-gray-200 p-4 rounded-lg transition-colors">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Activités principales</h3>
                  <div className="flex flex-wrap gap-2">
                    {club.activities.map((activity, idx) => (
                      <span key={idx} className="bg-white group-hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded transition-colors">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm">
                    <span className="text-gray-500 block">Responsable</span>
                    <span className="font-semibold text-gray-800">{club.leaderName}</span>
                  </div>
                  <a 
                    href={`https://wa.me/${club.leaderWhatsapp}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm"
                  >
                    <MessageCircle size={16} />
                    Contacter
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Clubs;