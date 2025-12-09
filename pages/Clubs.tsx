
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dataService, CINEMA_CLUB_ID } from '../services/dataService';
import { Club, ClubRegistration, Event } from '../types';
import { MessageCircle, Users, ClipboardList, X, AlertCircle, Eye, PlusCircle, Film, Clock } from 'lucide-react';

const Clubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  
  const [viewingMembersClub, setViewingMembersClub] = useState<Club | null>(null);
  const [membersList, setMembersList] = useState<ClubRegistration[]>([]);
  
  const [studentName, setStudentName] = useState('');
  const [studentLevel, setStudentLevel] = useState('Prépa 1');
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const [cinemaEvent, setCinemaEvent] = useState<Event | null>(null);

  // Countdown Timer State (Cinema Registration)
  const targetDate = new Date('2025-12-09T23:59:59').getTime();
  const [timeLeft, setTimeLeft] = useState<any>(null);

  // Countdown Timer State (Movie Showtime)
  const movieTargetDate = new Date('2025-12-12T17:30:00').getTime();
  const [movieTimeLeft, setMovieTimeLeft] = useState<any>({});

  const calculateTimeLeft = (target: number) => {
    const difference = target - new Date().getTime();
    let timeLeftDetails = {};
    if (difference > 0) {
      timeLeftDetails = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeftDetails;
  };

  useEffect(() => {
    const loadData = async () => {
      setClubs(await dataService.fetchClubs());
      const events = await dataService.fetchEvents();
      const event = events.find(e => e.title === 'Séance Cinéma');
      if (event) setCinemaEvent(event);
    };
    loadData();

    // Initialize timers on mount
    setTimeLeft(calculateTimeLeft(targetDate));
    setMovieTimeLeft(calculateTimeLeft(movieTargetDate));
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
      setMovieTimeLeft(calculateTimeLeft(movieTargetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Hook pour déclencher les animations au scroll
  useEffect(() => {
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
  }, [clubs, cinemaEvent]); // Redéclenche quand les données sont chargées

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
  
  const resetAndCloseModals = () => {
      setSubmitted(false);
      setSelectedClub(null);
      setStudentName('');
      setError('');
  };

  const inputStyle = "w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-bde-rose outline-none";
  const levels = ["Prépa 1", "Prépa 2", "B2 COM", "B2 CREA", "B2 DEV", "B3 COM", "B3 CREA", "B3 DEV"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 reveal active">
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
        
        {/* Featured Movie Section */}
        {cinemaEvent && (
          <section className="mb-16 bg-bde-navy rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-900/20 reveal active grid grid-cols-1 md:grid-cols-5 gap-8 items-center border-4 border-bde-rose/30">
            <div className="md:col-span-2">
              <img src={cinemaEvent.imageUrl} alt={cinemaEvent.title} className="w-full h-auto object-cover rounded-2xl shadow-lg aspect-[2/3]" />
            </div>
            <div className="md:col-span-3 text-white text-center md:text-left">
              <h2 className="text-sm font-bold uppercase tracking-widest text-bde-rose mb-2">Prochaine Séance</h2>
              <h3 className="text-3xl lg:text-4xl font-extrabold mb-4">{cinemaEvent.title}</h3>
              <p className="text-lg text-gray-300 mb-6">
                Rendez-vous le <strong>Vendredi 12 Décembre à 17h30</strong> à l'Open Space.
              </p>
              
              {Object.keys(movieTimeLeft).length > 0 ? (
                <div>
                    <h4 className="font-semibold text-gray-200 mb-3">Le film commence dans :</h4>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-center font-mono font-bold text-white">
                        <div className="bg-white/10 p-3 rounded-lg shadow-inner min-w-[70px]">
                          <span className="text-3xl">{String(movieTimeLeft.days).padStart(2, '0')}</span>
                          <span className="block text-xs opacity-70">Jours</span>
                        </div>
                        <span className="text-3xl opacity-50">:</span>
                        <div className="bg-white/10 p-3 rounded-lg shadow-inner min-w-[70px]">
                          <span className="text-3xl">{String(movieTimeLeft.hours).padStart(2, '0')}</span>
                          <span className="block text-xs opacity-70">Heures</span>
                        </div>
                        <span className="text-3xl opacity-50">:</span>
                        <div className="bg-white/10 p-3 rounded-lg shadow-inner min-w-[70px]">
                          <span className="text-3xl">{String(movieTimeLeft.minutes).padStart(2, '0')}</span>
                          <span className="block text-xs opacity-70">Min</span>
                        </div>
                        <span className="text-3xl opacity-50">:</span>
                        <div className="bg-white/10 p-3 rounded-lg shadow-inner min-w-[70px]">
                          <span className="text-3xl">{String(movieTimeLeft.seconds).padStart(2, '0')}</span>
                          <span className="block text-xs opacity-70">Sec</span>
                        </div>
                    </div>
                </div>
              ) : (
                <div className="bg-green-500/20 border border-green-400 text-green-300 p-4 rounded-lg text-center font-bold text-lg">
                    La séance a commencé !
                </div>
              )}
            </div>
          </section>
        )}


        {timeLeft && Object.keys(timeLeft).length > 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-lg mb-12 reveal active flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 shadow-lg">
            <div className="flex items-center gap-3">
              <Clock size={40} className="shrink-0 text-yellow-500" />
              <div>
                <h3 className="font-bold text-lg">Fin des inscriptions au Club Cinéma !</h3>
                <p className="text-sm">Les inscriptions se terminent le Mardi 09/12/2025 à 23h59.</p>
              </div>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-3 text-center font-mono font-bold">
              <div className="bg-white/50 p-3 rounded-lg shadow-inner min-w-[60px]">
                <span className="text-2xl">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="block text-xs opacity-70">Jours</span>
              </div>
              <span className="text-2xl">:</span>
              <div className="bg-white/50 p-3 rounded-lg shadow-inner min-w-[60px]">
                <span className="text-2xl">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="block text-xs opacity-70">Heures</span>
              </div>
              <span className="text-2xl">:</span>
              <div className="bg-white/50 p-3 rounded-lg shadow-inner min-w-[60px]">
                <span className="text-2xl">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="block text-xs opacity-70">Min</span>
              </div>
              <span className="text-2xl">:</span>
              <div className="bg-white/50 p-3 rounded-lg shadow-inner min-w-[60px]">
                <span className="text-2xl">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="block text-xs opacity-70">Sec</span>
              </div>
            </div>
          </div>
        ) : timeLeft !== null && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg mb-12 reveal active text-center">
              <h3 className="font-bold text-lg">Les inscriptions pour le Club Cinéma sont terminées.</h3>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {clubs.map((club, idx) => {
            const isCinemaClub = club.id === CINEMA_CLUB_ID;
            const areCinemaRegistrationsClosed = timeLeft !== null && isCinemaClub && Object.keys(timeLeft).length === 0;

            return (
              <div 
                key={club.id} 
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 flex flex-col reveal"
                style={{ transitionDelay: `${200 + idx * 100}ms` }}
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
                
                <div className="mt-auto pt-6 border-t border-gray-100 space-y-4">
                    <div className="bg-gray-50 group-hover:bg-white border border-transparent group-hover:border-gray-200 p-4 rounded-lg transition-colors">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Responsable</h3>
                      <p className="font-bold text-bde-navy">{club.leaderName}</p>
                    </div>

                  <div className="flex items-center justify-between gap-2">
                    <button 
                      onClick={() => { resetAndCloseModals(); setSelectedClub(club); }}
                      className={`flex-1 flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg font-medium transition shadow-md ${
                        areCinemaRegistrationsClosed 
                          ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                          : 'bg-bde-navy hover:bg-blue-900'
                      }`}
                      disabled={areCinemaRegistrationsClosed}
                    >
                      <ClipboardList size={16} /> {areCinemaRegistrationsClosed ? "Inscriptions Fermées" : "S'inscrire"}
                    </button>
                    <a 
                      href={`https://wa.me/${club.leaderWhatsapp}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-md"
                    >
                      <MessageCircle size={16} /> Contacter
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL UNIVERSELLE D'INSCRIPTION */}
      {selectedClub && (
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
                            Rejoindre le {selectedClub.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Remplissez ce formulaire pour valider.</p>
                        
                        {error && (
                            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">
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
            
            <div className="overflow-y-auto flex-1">
                 {loadingMembers ? (
                        <div className="flex justify-center items-center py-12"><span className="animate-spin h-8 w-8 border-4 border-bde-navy border-t-transparent rounded-full"></span></div>
                    ) : membersList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[500px]">
                                <thead className="bg-gray-100 text-gray-500 text-xs uppercase sticky top-0">
                                    <tr><th className="p-4 whitespace-nowrap">Étudiant</th><th className="p-4 whitespace-nowrap">Niveau</th><th className="p-4 text-right whitespace-nowrap">Inscrit le</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {membersList.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-medium text-gray-800 whitespace-nowrap">{member.studentName}</td>
                                            <td className="p-4 text-sm text-gray-600"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{member.studentLevel}</span></td>
                                            <td className="p-4 text-right text-sm text-gray-400 whitespace-nowrap">{new Date(member.date).toLocaleDateString('fr-FR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 flex flex-col items-center text-gray-400">
                            <Users size={48} className="mb-3 opacity-20" />
                            <p>Aucun membre inscrit pour le moment.</p>
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