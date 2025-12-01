
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dataService } from '../services/dataService';
import { Club, ClubRegistration, EventRegistration } from '../types';
import { MessageCircle, Users, ClipboardList, X, AlertCircle, Eye, PlusCircle, Film, Calendar, Link as LinkIcon } from 'lucide-react';

const Clubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  
  // View Members State
  const [viewingMembersClub, setViewingMembersClub] = useState<Club | null>(null);
  const [membersList, setMembersList] = useState<ClubRegistration[]>([]);
  
  // Registration Form
  const [studentName, setStudentName] = useState('');
  const [studentLevel, setStudentLevel] = useState('Prépa 1');
  const [studentWhatsapp, setStudentWhatsapp] = useState('');
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // --- NOUVEAU : State pour la Soirée Cinéma ---
  const cinemaEvent = {
    id: 'soiree-cinema-dec12',
    name: 'Soirée Cinéma',
  };
  const [showCinemaRegistration, setShowCinemaRegistration] = useState(false);
  const [showCinemaMembers, setShowCinemaMembers] = useState(false);
  const [cinemaMembersList, setCinemaMembersList] = useState<EventRegistration[]>([]);
  const [loadingCinemaMembers, setLoadingCinemaMembers] = useState(false);

  useEffect(() => {
    const load = async () => setClubs(await dataService.fetchClubs());
    load();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    
    setLoading(true);
    setError('');

    try {
        await dataService.registerToClub({
            clubId: selectedClub.id,
            studentName,
            studentLevel,
            studentWhatsapp,
            date: new Date().toISOString()
        });
        setSubmitted(true);
    } catch (err) {
        console.error("Erreur inscription:", err);
        setError("Une erreur est survenue lors de l'inscription.");
    } finally {
        setLoading(false);
    }
  };

  const handleCinemaRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        await dataService.addEventRegistration({
            eventId: cinemaEvent.id,
            eventName: cinemaEvent.name,
            studentName,
            studentLevel,
            studentWhatsapp,
            date: new Date().toISOString(),
        });
        setSubmitted(true);
    } catch (err) {
        setError("Une erreur est survenue lors de l'inscription à l'événement.");
    } finally {
        setLoading(false);
    }
  };

  const handleViewMembers = async (club: Club) => {
    setViewingMembersClub(club);
    setLoadingMembers(true);
    try {
        const regs = await dataService.fetchClubRegistrations(club.id);
        setMembersList(regs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
        console.error("Erreur chargement membres:", err);
    } finally {
        setLoadingMembers(false);
    }
  };

  const handleViewCinemaMembers = async () => {
      setShowCinemaMembers(true);
      setLoadingCinemaMembers(true);
      try {
          const regs = await dataService.fetchEventRegistrations(cinemaEvent.id);
          setCinemaMembersList(regs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
          console.error("Erreur chargement inscrits cinéma:", err);
      } finally {
          setLoadingCinemaMembers(false);
      }
  };
  
  const resetAndCloseModals = () => {
      setSubmitted(false);
      setSelectedClub(null);
      setShowCinemaRegistration(false);
      setStudentName('');
      setStudentWhatsapp('');
      setError('');
  };

  const inputStyle = "w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-bde-rose outline-none";
  const levels = ["Prépa 1", "Prépa 2", "B2 COM", "B2 CREA", "B2 DEV", "B3 COM", "B3 CREA", "B3 DEV"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-bde-navy mb-4">Vie Associative</h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-10">
            Développez vos talents et vos passions en rejoignant l'un de nos clubs dynamiques.
          </p>
          <a
            href="https://wa.me/2250789609672?text=Bonjour%20M%C3%A9hdi,%20je%20suis%20int%C3%A9ress%C3%A9(e)%20pour%20devenir%20responsable%20de%20club%20ou%20proposer%20une%20nouvelle%20id%C3%A9e."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-bde-rose text-white px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg shadow-rose-500/30"
          >
            <PlusCircle size={24} />
            Devenir Responsable / Proposer un Club
          </a>
        </div>

        {/* --- CARTE SPÉCIALE SOIRÉE CINÉMA --- */}
        <div className="bg-gradient-to-br from-bde-navy to-blue-900 text-white rounded-3xl p-8 mb-16 shadow-2xl animate-fade-in-up flex flex-col md:flex-row items-center gap-8" style={{animationDelay: '0.1s'}}>
            <div className="bg-bde-rose/20 p-5 rounded-2xl border-2 border-bde-rose/50">
                <Film size={48} className="text-bde-rose" />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">Soirée Cinéma</h2>
                <p className="text-blue-200 mb-2 flex items-center justify-center md:justify-start gap-2">
                    <Calendar size={16} /> Vendredi 12 Décembre • 17h • Open Space
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2 bg-green-500/20 text-green-300 text-xs font-medium px-3 py-1.5 rounded-full mb-4 inline-flex">
                    <LinkIcon size={14} />
                    <span>En t'inscrivant, tu rejoins aussi le Club Cinéma !</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <button onClick={() => setShowCinemaRegistration(true)} className="bg-bde-rose hover:bg-rose-600 px-6 py-3 font-bold rounded-lg transition-transform hover:scale-105">
                        Je m'inscris !
                    </button>
                    <button onClick={handleViewCinemaMembers} className="bg-white/10 hover:bg-white/20 px-6 py-3 font-bold rounded-lg transition-transform hover:scale-105 flex items-center justify-center gap-2">
                        <Eye size={16} /> Voir les inscrits
                    </button>
                </div>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {clubs.map((club, idx) => (
            <div 
              key={club.id} 
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 flex flex-col animate-fade-in-up"
              style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="bg-blue-50 group-hover:bg-bde-navy transition-colors duration-300 w-16 h-16 p-4 rounded-xl shadow-inner flex items-center justify-center text-3xl">
                  {club.emoji ? (
                    <span className="text-bde-navy group-hover:text-white transition-colors duration-300">{club.emoji}</span>
                  ) : (
                    <Users className="text-bde-navy group-hover:text-white transition-colors duration-300 w-8 h-8" />
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Actif</span>
                    <button 
                        onClick={() => handleViewMembers(club)}
                        className="text-xs text-gray-500 hover:text-bde-rose flex items-center gap-1 mt-1 transition-colors"
                    >
                        <Eye size={12} /> Voir les membres
                    </button>
                </div>
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

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
                  <button 
                    onClick={() => { resetAndCloseModals(); setSelectedClub(club); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-bde-navy text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900 transition shadow-md"
                  >
                    <ClipboardList size={16} /> S'inscrire
                  </button>
                  <a 
                    href={`https://wa.me/${club.leaderWhatsapp}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md"
                  >
                    <MessageCircle size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL UNIVERSELLE D'INSCRIPTION */}
      {(selectedClub || showCinemaRegistration) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button onClick={resetAndCloseModals} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
                
                {submitted ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Inscription Réussie !</h3>
                        <p className="text-gray-500 mt-2">Merci pour votre engagement.</p>
                    </div>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-bde-navy mb-1">
                            {selectedClub ? `Rejoindre le ${selectedClub.name}` : `S'inscrire à la ${cinemaEvent.name}`}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Remplissez ce formulaire pour valider.</p>
                        
                        {error && (
                            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={selectedClub ? handleRegister : handleCinemaRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nom & Prénoms</label>
                                <input type="text" required className={inputStyle} value={studentName} onChange={e => setStudentName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Niveau</label>
                                <select className={inputStyle} value={studentLevel} onChange={e => setStudentLevel(e.target.value)}>
                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp</label>
                                <input type="text" required className={inputStyle} value={studentWhatsapp} onChange={e => setStudentWhatsapp(e.target.value)} placeholder="07..." />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-bde-navy text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition shadow-lg mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Valider'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
      )}

      {/* MODAL LISTE DES MEMBRES (Clubs) */}
      {viewingMembersClub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-bde-navy flex items-center gap-2">
                        <Users size={20} className="text-bde-rose"/>
                        Membres : {viewingMembersClub.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{membersList.length} étudiant(s) inscrit(s)</p>
                </div>
                <button onClick={() => setViewingMembersClub(null)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1">
                {/* ... (table content same as before) ... */}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTE DES INSCRITS (Cinéma) */}
      {showCinemaMembers && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-bde-navy flex items-center gap-2">
                            <Film size={20} className="text-bde-rose"/>
                            Inscrits : {cinemaEvent.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{cinemaMembersList.length} participant(s)</p>
                    </div>
                    <button onClick={() => setShowCinemaMembers(null)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                </div>
                <div className="p-0 overflow-y-auto flex-1">
                    {loadingCinemaMembers ? (
                        <div className="flex justify-center items-center py-12"><span className="animate-spin h-8 w-8 border-4 border-bde-navy border-t-transparent rounded-full"></span></div>
                    ) : cinemaMembersList.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 text-gray-500 text-xs uppercase sticky top-0">
                                <tr><th className="p-4">Étudiant</th><th className="p-4">Niveau</th><th className="p-4 text-right">Inscrit le</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cinemaMembersList.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-medium text-gray-800">{member.studentName}</td>
                                        <td className="p-4 text-sm text-gray-600"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{member.studentLevel}</span></td>
                                        <td className="p-4 text-right text-sm text-gray-400">{new Date(member.date).toLocaleDateString('fr-FR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-12 flex flex-col items-center text-gray-400">
                            <Users size={48} className="mb-3 opacity-20" />
                            <p>Aucun inscrit pour le moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Clubs;
