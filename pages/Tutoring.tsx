import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MessageCircle, BookOpen, GraduationCap } from 'lucide-react';
import { dataService } from '../services/dataService';

const Tutoring = () => {
  const mentors = dataService.getMentors();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-bde-navy rounded-3xl p-8 md:p-12 text-center text-white mb-16 relative overflow-hidden shadow-xl animate-fade-in-up">
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

        <div className="mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
           <h2 className="text-2xl font-bold text-bde-navy mb-8 flex items-center gap-3">
             <BookOpen className="text-bde-rose" />
             Nos Mentors disponibles
           </h2>
           
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
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Tutoring;