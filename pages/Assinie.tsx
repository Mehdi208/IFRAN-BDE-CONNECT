import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dataService } from '../services/dataService';
import { Palmtree, MapPin, Clock, Info, CheckCircle2, Waves, Sun, Anchor, Utensils } from 'lucide-react';

const Assinie = () => {
  const levels = ["B1 COM", "B1 CREA", "B1 DEV", "B2 COM", "B2 CREA", "B2 DEV", "B3 COM", "B3 CREA", "B3 DEV", "Master 1", "Master 2"];

  const [formData, setFormData] = useState({
    studentName: '',
    studentClass: '',
    phone: '',
    needsGlaciere: false,
    needsPochette: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.studentClass || !formData.phone) return;

    setIsSubmitting(true);
    try {
      await dataService.addAssinieRegistration({
        ...formData,
        registrationDate: new Date().toISOString()
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Error registering:", error);
      alert("Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#021d38] font-sans text-gray-100">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-gradient-to-b from-[#ff5e00] via-[#ff9500] to-[#021d38]">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}></div>
        <div className="absolute top-0 right-0 p-8 opacity-40 transform translate-x-1/4 -translate-y-1/4">
          <Sun size={240} className="text-yellow-200" />
        </div>
        <div className="absolute bottom-0 left-0 p-8 opacity-20 transform -translate-x-1/4 translate-y-1/4">
          <Palmtree size={200} className="text-[#002f52]" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-block bg-[#021d38]/40 backdrop-blur-md px-5 py-2 rounded-full text-xs font-bold tracking-widest text-yellow-300 uppercase mb-6 border border-white/20">
            Sortie Officielle • 2025
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-2 leading-none font-display tracking-tighter uppercase italic" style={{ textShadow: "4px 4px 0px rgba(0,0,0,0.2)" }}>
            Digital
          </h1>
          <h1 className="text-6xl md:text-8xl font-black text-[#ffcc00] mb-6 leading-none font-display tracking-tighter uppercase italic" style={{ textShadow: "4px 4px 0px rgba(0,0,0,0.2)" }}>
            Break
          </h1>
          <p className="text-2xl text-white font-medium italic mb-8" style={{ fontFamily: "cursive", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
            L'expérience hors connexion
          </p>
          <div className="inline-block bg-[#00C2CB] text-[#021d38] font-bold text-xl md:text-2xl px-6 md:px-10 py-3 rounded-full flex items-center justify-center gap-3 w-fit mx-auto shadow-xl shadow-cyan-500/20">
            <MapPin size={28} />
            Assinie-Mafia • L'Embouchure
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-[#0b2b4d] p-6 rounded-2xl shadow-lg border border-[#16406c]">
            <div className="w-12 h-12 bg-[#00c2cb]/20 text-[#00c2cb] rounded-xl flex items-center justify-center mb-4">
              <MapPin size={24} />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Destination</h3>
            <p className="text-blue-200">Assinie-Mafia, L'Embouchure (pointe où la lagune rencontre l'océan).</p>
          </div>
          
          {/* Card 2 */}
          <div className="bg-[#0b2b4d] p-6 rounded-2xl shadow-lg border border-[#16406c]">
            <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Dates & Logistique</h3>
            <p className="text-blue-200">Date de la sortie : <strong className="text-orange-400">18 Juillet</strong><br />Départ 08h00 devant l'IFRAN. Date limite d'inscription : 28 juin.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0b2b4d] p-6 rounded-2xl shadow-lg border border-[#16406c]">
            <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center mb-4">
              <Utensils size={24} />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Budget</h3>
            <p className="text-blue-200">Cotisation : 15 000 FCFA tout inclus (Transport A/R, BBQ, Boissons, Activités).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Info Details */}
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-[#00c2cb] mb-4 flex items-center gap-2">
                <Waves className="text-[#00c2cb]" />
                Inclus au programme
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-orange-400 shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-300">Transport Aller/Retour en car</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-orange-400 shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-300">Traversée lagunaire</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-orange-400 shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-300">Barbecue (Repas & Boissons)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-orange-400 shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-300">Activités & Tournois inter-filières</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-orange-400 shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-300">Maîtres-nageurs & sécurité</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00c2cb] mb-4 flex items-center gap-2">
                <Info className="text-[#00c2cb]" />
                Informations complémentaires
              </h2>
              <div className="bg-[#0b2b4d] border border-[#16406c] p-5 rounded-2xl">
                <p className="text-blue-200 mb-4">
                  <strong>Activités en option :</strong> Jet-Ski (1000 FCFA/min, min 3 mins), balades en Yacht.
                </p>
                <p className="text-white mb-2 font-semibold">À ne pas oublier :</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                  <li>Glacières avec blocs de glace (glace rare sur place)</li>
                  <li>Pochettes étanches pour smartphones</li>
                  <li>Ponctualité (départ rigoureux à 8h pour éviter les embouteillages)</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Registration Form */}
          <div className="bg-[#0b2b4d] p-8 rounded-3xl shadow-2xl border border-[#00c2cb]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00c2cb]/10 rounded-full -mr-16 -mt-16 z-0"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Anchor className="text-yellow-400" />
                S'inscrire à la sortie
              </h2>
              
              {isSuccess ? (
                <div className="bg-[#00c2cb]/10 border border-[#00c2cb]/30 p-6 rounded-2xl text-center">
                  <div className="w-16 h-16 bg-[#00c2cb] text-[#021d38] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Inscription confirmée !</h3>
                  <p className="text-gray-300">Préparez vos maillots, on vous contactera très vite pour les détails.</p>
                  <button 
                    onClick={() => {
                      setIsSuccess(false);
                      setFormData({ studentName: '', studentClass: '', phone: '', needsGlaciere: false, needsPochette: false });
                    }}
                    className="mt-6 text-[#00c2cb] font-semibold hover:underline"
                  >
                    Inscrire une autre personne
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Nom complet</label>
                    <input 
                      type="text" required
                      value={formData.studentName}
                      onChange={e => setFormData({...formData, studentName: e.target.value})}
                      className="w-full p-3 bg-[#021d38] border border-[#16406c] rounded-xl focus:ring-2 focus:ring-[#00c2cb] focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Filière / Classe</label>
                    <select 
                      required
                      value={formData.studentClass}
                      onChange={e => setFormData({...formData, studentClass: e.target.value})}
                      className="w-full p-3 bg-[#021d38] border border-[#16406c] rounded-xl focus:ring-2 focus:ring-[#00c2cb] focus:border-transparent outline-none transition-all text-white"
                    >
                      <option value="" disabled>Sélectionnez votre classe</option>
                      {levels.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                      <option value="Externe (Invité)">Externe (Invité)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Numéro WhatsApp</label>
                    <input 
                      type="tel" required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 bg-[#021d38] border border-[#16406c] rounded-xl focus:ring-2 focus:ring-[#00c2cb] focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                      placeholder="Ex: 0102030405"
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-[#16406c]">
                    <p className="block text-sm font-semibold text-gray-300 mb-3">Options</p>
                    <label className="flex items-center gap-3 mb-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={formData.needsGlaciere}
                        onChange={e => setFormData({...formData, needsGlaciere: e.target.checked})}
                        className="w-5 h-5 text-[#00c2cb] border-gray-600 rounded bg-[#021d38] focus:ring-[#00c2cb]"
                      />
                      <span className="text-gray-300 text-sm group-hover:text-white transition-colors">Je peux amener une glacière avec des blocs de glace</span>
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#ff5e00] hover:bg-[#ff7a2e] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 flex justify-center items-center mt-6 uppercase tracking-wider"
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Confirmer mon inscription'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Assinie;
