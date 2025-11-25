import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dataService } from '../services/dataService';
import { Member } from '../types';
import { MessageCircle } from 'lucide-react';

const Team = () => {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    setMembers(dataService.getMembers());
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-bde-navy mb-4">Le Bureau 2025-2026</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Une équipe dévouée au service des étudiants.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {members.map((member, idx) => (
            <div 
              key={member.id} 
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
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
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Team;