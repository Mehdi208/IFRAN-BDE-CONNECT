
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MessageCircle, BookOpen, GraduationCap, HelpCircle, Users, Clock, Lightbulb } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Mentor } from '../types';

const Tutoring = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMentors = async () => {
      const data = await dataService.fetchMentors();
      setMentors(data);
      setLoading(false);
    };
    loadMentors();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* HERO SECTION */}
        <div className="bg-bde-navy rounded-3xl p-8 md:p-12 text-center text-white mb-12 relative overflow-hidden shadow-xl animate-fade-in-up">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
             <GraduationCap size={64} className="mx-auto mb-6 text-bde-rose" />
             <h1 className="text-3xl md:text-5xl font-bold mb-6">Le Tutorat à IFRAN</h1>
             <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
               Besoin d'aide pour comprendre un cours ? Nos mentors sont là pour vous aider.
               L'organisation se fait principalement via notre communauté WhatsApp.
             </p>
             <a 
               href="https://chat.whatsapp.com/JsE5unrSsXJ22lcESz3Jof?mode=hqrt1" 
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg"
             >
               <MessageCircle size={24} />
               Rejoindre le groupe WhatsApp
             </a>
           </div>
        </div>

        {/* EXPLANATORY SECTION */}
        <div className="mb-16 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <h2 className="text-2xl font-bold text-bde-navy mb-8 flex items-center gap-3">
            <HelpCircle className="text-bde-rose" />
            Comment fonctionne le tutorat ?
          </h2>
          
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed italic">
                  "Le tutorat n’est pas un dispositif automatique ou fixe. Il est proposé lorsque les étudiants rencontrent des difficultés, notamment dans le cadre des workshops ou des projets académiques."
                </p>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-bde-navy flex items-center gap-2">
                    <Users size={20} className="text-bde-rose" />
                    Deux façons d'obtenir de l'aide :
                  </h3>
                  <ul className="space-y-4 ml-2">
                    <li className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-bde-rose mt-2 shrink-0"></div>
                      <p className="text-gray-600 text-sm">
                        <strong className="text-bde-navy">Contact direct :</strong> Contactez directement un tuteur en lien avec votre filière ou celle du workshop/projet concerné.
                      </p>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-bde-rose mt-2 shrink-0"></div>
                      <p className="text-gray-600 text-sm">
                        <strong className="text-bde-navy">IFRAN SOLIDARITÉ :</strong> Posez votre question dans le groupe WhatsApp <span className="font-bold">📘 IFRAN SOLIDARITÉ – TUTORAT 24/7</span> si vous ne souhaitez pas contacter un tuteur directement ou s'ils sont indisponibles.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
                <div className="flex gap-4">
                  <Clock className="text-bde-rose shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-bde-navy mb-1">Flexibilité & Horaires</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Le tuteur et le ou les étudiants accompagnés s’accordent ensemble sur un jour et un horaire en fonction de leurs emplois du temps respectifs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Users className="text-bde-rose shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-bde-navy mb-1">Réponses Collectives</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Le groupe permet également aux étudiants de s’entraider entre eux et de bénéficier de réponses collectives à tout moment.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Lightbulb className="text-yellow-500 shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-bde-navy mb-1">Objectif</h4>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                      Le tutorat repose sur l’entraide, la collaboration et le partage de compétences pour favoriser la réussite collective.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MENTORS LIST */}
        <div className="mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
           <h2 className="text-2xl font-bold text-bde-navy mb-8 flex items-center gap-3">
             <BookOpen className="text-bde-rose" />
             Nos Mentors disponibles
           </h2>
           
           {loading ? (
             <div className="text-center py-12 text-gray-500">Chargement des mentors...</div>
           ) : mentors.length > 0 ? (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {mentors.map((mentor, idx) => (
                 <div key={mentor.id} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-bde-rose flex justify-between items-center hover:shadow-lg transition-all animate-fade-in-up" style={{ animationDelay: `${0.2 + (idx * 0.1)}s` }}>
                   <div>
                     <h3 className="font-bold text-lg text-gray-800">{mentor.name}</h3>
                     <span className="inline-block bg-blue-50 text-bde-navy text-xs px-2 py-1 rounded mt-1 font-medium">
                       {mentor.subject}
                     </span>
                   </div>
                   <a 
                     href={`https://wa.me/${mentor.whatsapp}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-green-500 hover:text-green-600 bg-green-50 p-3 rounded-full transition-colors hover:bg-green-100"
                   >
                     <MessageCircle size={24} />
                   </a>
                 </div>
               ))}
             </div>
           ) : (
             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                Aucun mentor enregistré pour le moment.
             </div>
           )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Tutoring;
