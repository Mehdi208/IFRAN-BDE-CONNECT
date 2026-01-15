
import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dataService } from '../services/dataService';
import { Club, Atelier, ClubRegistration } from '../types';
import { MessageCircle, Users, ClipboardList, X, Eye, PlusCircle, Check, Map as MapIcon, Calendar, Clock, Sparkles, List, Info, ArrowLeft, User } from 'lucide-react';

const Clubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [selectedAtelier, setSelectedAtelier] = useState<Atelier | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  
  const [studentName, setStudentName] = useState('');
  const [studentLevel, setStudentLevel] = useState('Prépa 1');
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // États pour les listes de participants
  const [showAtelierRegistrations, setShowAtelierRegistrations] = useState(false);
  const [showClubMembers, setShowClubMembers] = useState(false);
  const [viewingClub, setViewingClub] = useState<Club | null>(null);
  
  const [allRegs, setAllRegs] = useState<ClubRegistration[]>([]);
  const [activeAtelierFilter, setActiveAtelierFilter] = useState<string | null>(null);

  const targetDate = new Date('2026-02-27T14:00:00').getTime();
  const [timeLeft, setTimeLeft] = useState<any>({});
  const [isEventToday, setIsEventToday] = useState(false);

  const calculateTimeLeft = () => {
    const now = new Date();
    const diff = targetDate - now.getTime();
    const eventDay = new Date(targetDate);
    setIsEventToday(now.toDateString() === eventDay.toDateString());
    if (diff <= 0) return {};
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const loadData = async () => {
    const [c, a, regs] = await Promise.all([
        dataService.fetchClubs(), 
        dataService.fetchAteliers(),
        dataService.fetchClubRegistrations()
    ]);
    setClubs(c); 
    setAteliers(a);
    setAllRegs(regs);
  };

  useEffect(() => {
    loadData();
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtrage ULTRA-STRICT des inscriptions aux ateliers
  // On ne compte que si l'atelierId appartient à la liste des ateliers chargés
  const allAtelierRegs = useMemo(() => {
    const validAtelierIds = ateliers.map(a => a.id);
    return allRegs.filter(r => 
        r.isAtelier === true && 
        r.atelierId && 
        validAtelierIds.includes(r.atelierId)
    );
  }, [allRegs, ateliers]);

  // Filtrage STRICT des inscriptions aux clubs
  const allClubRegs = useMemo(() => {
    const validClubIds = clubs.map(c => c.id);
    return allRegs.filter(r => 
        r.isAtelier !== true && 
        r.clubId && 
        validClubIds.includes(r.clubId)
    );
  }, [allRegs, clubs]);

  const handleRegister = async (e: React.FormEvent, isAtelier: boolean = false) => {
    e.preventDefault();
    const id = isAtelier ? selectedAtelier?.id : selectedClub?.id;
    if (!id) return;
    
    setLoading(true);
    try {
      await dataService.registerToClub({
        atelierId: isAtelier ? id : undefined,
        clubId: !isAtelier ? id : undefined,
        studentName, 
        studentLevel,
        date: new Date().toISOString(),
        isAtelier
      });
      setSubmitted(true);
      await loadData();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const resetModals = () => { 
    setSubmitted(false); 
    setSelectedClub(null); 
    setSelectedAtelier(null); 
    setViewingClub(null);
    setStudentName(''); 
    setShowClubMembers(false);
  };

  const inputStyle = "w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 focus:ring-2 focus:ring-bde-rose focus:border-bde-rose outline-none font-bold text-bde-navy transition-all";
  const levels = ["Prépa 1", "Prépa 2", "B2 COM", "B2 CREA", "B2 DEV", "B3 COM", "B3 CREA", "B3 DEV", "Master 1", "Master 2"];

  const filteredAteliersForList = useMemo(() => {
      if (!activeAtelierFilter) return ateliers;
      return ateliers.filter(a => a.id === activeAtelierFilter);
  }, [ateliers, activeAtelierFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* SECTION AFTERNOON DAY CLUB */}
        <section className="mb-16 bg-gradient-to-br from-bde-navy to-indigo-900 rounded-[40px] p-6 sm:p-12 shadow-2xl relative overflow-hidden border-b-8 border-bde-rose">
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-white/10">
                <Sparkles size={14} className="text-yellow-400" /> Save the Date : Edition 2026
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-[1.1]">Afternoon<br/><span className="text-bde-rose">Day Club</span></h2>
              <p className="text-blue-100 text-lg mb-8 font-medium max-w-lg">
                Le <strong>Vendredi 27 Février 2026</strong>, vivez une expérience immersive. Participez à des ateliers exclusifs animés par vos clubs préférés.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl text-white border border-white/10">
                  <Calendar size={20} className="text-bde-rose" />
                  <div><span className="block text-[10px] uppercase font-black text-gray-400">Date</span><span className="font-bold text-sm">27 Février 2026</span></div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl text-white border border-white/10">
                  <Clock size={20} className="text-bde-rose" />
                  <div><span className="block text-[10px] uppercase font-black text-gray-400">Heure</span><span className="font-bold text-sm">14h00 - 17h00</span></div>
                </div>
              </div>
              <button onClick={() => document.getElementById('ateliers')?.scrollIntoView({behavior:'smooth'})} className="bg-bde-rose hover:bg-rose-600 text-white px-10 py-5 rounded-3xl font-black text-lg shadow-xl hover:scale-105 transition-all">
                Réserver mon Atelier
              </button>
            </div>
            <div className="flex flex-col items-center lg:items-end">
              {isEventToday ? (
                <div className="text-white text-center animate-bounce">
                  <div className="text-7xl font-black mb-2">NOW!</div>
                  <div className="text-bde-rose font-black bg-white/10 px-4 py-2 rounded-xl">C'est aujourd'hui</div>
                </div>
              ) : Object.keys(timeLeft).length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {[{val:timeLeft.days,u:'Jours'},{val:timeLeft.hours,u:'Hrs'},{val:timeLeft.minutes,u:'Min'},{val:timeLeft.seconds,u:'Sec'}].map((t,i)=>(
                    <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-[32px] w-28 h-28 flex flex-col items-center justify-center backdrop-blur-2xl">
                      <span className="text-3xl font-black text-white">{String(t.val).padStart(2,'0')}</span>
                      <span className="text-[10px] uppercase font-black text-bde-rose mt-2">{t.u}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="text-white font-black text-xl">L'événement est terminé</div>}
              <button onClick={() => { setActiveAtelierFilter(null); setShowAtelierRegistrations(true); }} className="mt-8 text-white/60 hover:text-white font-bold flex items-center gap-2 group transition-colors">
                <List size={20} /> Voir la liste globale
              </button>
            </div>
          </div>
        </section>

        {/* LISTE DES ATELIERS - GRID LAYOUT */}
        <div id="ateliers" className="mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-black text-bde-navy mb-4 flex items-center gap-3">
                <MapIcon className="text-bde-rose" size={32} /> Ateliers & Workshops
              </h2>
              <p className="text-gray-500 font-medium max-w-lg">Inscrivez-vous à l'atelier de votre choix pour l'après-midi du 27 Février.</p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-bold border border-blue-100 flex items-center gap-3">
              <Users size={20} /> {allAtelierRegs.length} inscrits au total
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ateliers.length > 0 ? (
              ateliers.map(a => (
                <div 
                  key={a.id} 
                  className="flex flex-col bg-white rounded-[32px] p-8 border-2 border-gray-200 hover:border-bde-rose transition-all group/card shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-5xl drop-shadow-sm group-hover/card:scale-110 transition-transform">{a.emoji}</span>
                    <div className="bg-bde-navy/5 text-bde-navy px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2">
                       <MapIcon size={12} /> {a.room}
                    </div>
                  </div>
                  
                  <h4 className="font-black text-2xl text-bde-navy mb-4 leading-tight group-hover/card:text-bde-rose transition-colors">
                    {a.name}
                  </h4>
                  
                  <p className="text-gray-600 text-sm mb-8 flex-1 font-medium leading-relaxed italic">
                    "{a.description}"
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-bde-rose" />
                          <span className="text-xs font-black text-bde-navy">
                            {allAtelierRegs.filter(r => r.atelierId === a.id).length} inscrits
                          </span>
                        </div>
                        <button 
                          onClick={() => { setActiveAtelierFilter(a.id); setShowAtelierRegistrations(true); }} 
                          className="text-gray-400 hover:text-bde-navy font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                            <Eye size={12}/> Liste participants
                        </button>
                    </div>
                    <button 
                      onClick={() => { resetModals(); setSelectedAtelier(a); }} 
                      className="w-full bg-bde-navy text-white py-3.5 rounded-2xl font-black hover:bg-bde-rose transition-all shadow-lg active:scale-95"
                    >
                      S'inscrire à cet atelier
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
                <Info size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest">Aucun atelier de prévu pour le moment...</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION CLUBS PERMANENTS */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-bde-navy mb-4">Vie Associative & Recrutement</h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium mb-10">Les clubs recrutent toute l'année. Prêt à t'engager dans une communauté dynamique ?</p>
          <div className="flex justify-center gap-4">
             <a href="https://wa.me/2250789609672" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white border-2 border-bde-navy text-bde-navy px-8 py-4 rounded-3xl font-black hover:bg-bde-navy hover:text-white transition-all shadow-sm">
                <PlusCircle size={24} /> Créer un Club
              </a>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
          {clubs.map(club => (
            <div key={club.id} className="bg-white rounded-[40px] p-10 shadow-sm hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-gray-100 hover:border-bde-rose/30 flex flex-col group">
              <div className="flex items-center justify-between mb-8">
                <div className="bg-gray-50 group-hover:bg-bde-rose/10 transition-colors w-20 h-20 rounded-3xl flex items-center justify-center text-4xl">{club.emoji}</div>
                <div className="text-right">
                   <button 
                    onClick={() => { setViewingClub(club); setShowClubMembers(true); }}
                    className="flex items-center gap-2 text-gray-400 hover:text-bde-navy font-bold text-xs uppercase transition-colors"
                   >
                     <Eye size={14}/> {allClubRegs.filter(r => r.clubId === club.id).length} membres
                   </button>
                </div>
              </div>
              <h2 className="text-2xl font-black text-bde-navy mb-4 group-hover:text-bde-rose transition-colors">{club.name}</h2>
              
              {/* Affichage du responsable mis en valeur */}
              <div className="flex items-center gap-2 mb-4 bg-gray-50 px-3 py-1.5 rounded-xl w-fit border border-gray-100">
                <User size={14} className="text-bde-rose" />
                <span className="text-xs font-black text-gray-600 uppercase tracking-wide">Responsable : {club.leaderName}</span>
              </div>

              <p className="text-gray-500 mb-8 flex-1 font-medium leading-relaxed">{club.description}</p>
              <div className="mt-auto pt-8 border-t border-gray-50 flex gap-3">
                <button onClick={() => { resetModals(); setSelectedClub(club); }} className="flex-1 bg-bde-navy text-white py-4 rounded-2xl font-black text-sm hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <ClipboardList size={18} /> Rejoindre
                </button>
                <a href={`https://wa.me/${club.leaderWhatsapp}`} className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl transition-all shadow-lg"><MessageCircle size={22} /></a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL INSCRIPTION ATELIER */}
      {selectedAtelier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl w-full max-w-md p-10 relative border-4 border-bde-rose/20 my-auto">
            <button onClick={resetModals} className="absolute top-6 right-6 p-2 bg-gray-100 text-gray-500 hover:text-bde-navy hover:bg-gray-200 rounded-full transition-all"><X size={28}/></button>
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Check size={48} /></div>
                <h3 className="text-3xl font-black text-bde-navy mb-4">Inscription validée !</h3>
                <p className="text-gray-500 font-medium mb-10">Ta place est réservée pour l'atelier <strong>{selectedAtelier.name}</strong>. À vendredi !</p>
                <div className="space-y-3">
                   <button onClick={() => { 
                       const aid = selectedAtelier.id;
                       resetModals(); 
                       setActiveAtelierFilter(aid);
                       setShowAtelierRegistrations(true); 
                   }} className="w-full bg-bde-rose text-white py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                     <List size={20} /> Voir qui sera là
                   </button>
                   <button onClick={resetModals} className="w-full bg-bde-navy text-white py-4 rounded-2xl font-black hover:opacity-90">Fermer</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                     <span className="text-5xl">{selectedAtelier.emoji}</span>
                     <span className="text-[10px] font-black bg-bde-rose/10 text-bde-rose px-3 py-1 rounded-full uppercase tracking-widest">Workshop 27 Février</span>
                  </div>
                  <h3 className="text-3xl font-black text-bde-navy">{selectedAtelier.name}</h3>
                  <p className="text-gray-400 text-sm font-bold flex items-center gap-1 mt-2"><MapIcon size={14} /> {selectedAtelier.room}</p>
                </div>
                <form onSubmit={(e) => handleRegister(e, true)} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Ton Nom Complet</label>
                    <input type="text" required className={inputStyle} value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Prénom Nom" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Ton Niveau</label>
                    <select className={inputStyle} value={studentLevel} onChange={e => setStudentLevel(e.target.value)}>{levels.map(l => <option key={l} value={l}>{l}</option>)}</select>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-bde-rose text-white py-5 rounded-[24px] font-black text-lg hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 disabled:opacity-50">{loading ? 'Envoi...' : 'Confirmer ma place'}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL LISTE INSCRITS ATELIERS */}
      {showAtelierRegistrations && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border-t-8 border-t-bde-rose overflow-hidden animate-fade-in">
            <div className="p-6 md:p-8 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-bde-navy flex items-center gap-3">
                  <Sparkles className="text-bde-rose"/> {activeAtelierFilter ? 'Participants Atelier' : 'Tous les Participants'}
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-tight">Afternoon Day Club • 27 Février 2026</p>
              </div>
              <button 
                onClick={() => setShowAtelierRegistrations(false)} 
                className="p-2 md:p-3 bg-white text-gray-400 hover:text-bde-navy hover:bg-gray-100 rounded-full shadow-sm transition-all"
              >
                <X size={28}/>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 md:p-10">
              <div className="space-y-8 pb-10">
                {filteredAteliersForList.map(a => {
                    const regs = allAtelierRegs.filter(r => r.atelierId === a.id);
                    if (regs.length === 0 && activeAtelierFilter) return (
                        <div key={a.id} className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Info size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-black uppercase text-sm tracking-widest">Aucun inscrit pour cet atelier.</p>
                        </div>
                    );
                    if (regs.length === 0) return null;
                    return (
                        <div key={a.id} className="bg-white border-2 border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm hover:border-bde-rose/30 transition-all group">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                                    <h4 className="font-black text-xl text-bde-navy leading-tight">{a.name}</h4>
                                </div>
                                <span className="text-[10px] font-black text-white bg-bde-navy px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-2">
                                    <MapIcon size={12}/> {a.room}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {regs.map(r => (
                                <div key={r.id} className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center border border-transparent hover:bg-white hover:border-bde-rose/20 transition-all">
                                    <span className="text-sm font-bold text-gray-700">{r.studentName}</span>
                                    <span className="text-[10px] bg-bde-rose/10 text-bde-rose px-2 py-0.5 rounded-lg font-black uppercase">{r.studentLevel}</span>
                                </div>
                            ))}
                            </div>
                        </div>
                    );
                })}
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-center gap-3">
                 {activeAtelierFilter && (
                     <button onClick={() => setActiveAtelierFilter(null)} className="px-8 py-4 bg-white border-2 border-bde-navy text-bde-navy rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-sm">
                        <List size={20}/> Voir tout le monde
                     </button>
                 )}
                 <button onClick={() => setShowAtelierRegistrations(false)} className="px-8 py-4 bg-bde-navy text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-bde-rose transition-all shadow-lg active:scale-95">
                    <ArrowLeft size={20}/> Retour aux ateliers
                 </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTE MEMBRES CLUBS (PUBLIC) */}
      {showClubMembers && viewingClub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border-t-8 border-t-bde-navy overflow-hidden animate-fade-in">
                <div className="p-6 md:p-8 border-b flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-bde-navy flex items-center gap-3">
                          <Users className="text-bde-rose"/> Membres du club {viewingClub.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-tight">IFRAN • Saison 2025-2026</p>
                    </div>
                    <button onClick={resetModals} className="p-2 md:p-3 bg-white text-gray-400 hover:text-bde-navy hover:bg-gray-100 rounded-full shadow-sm transition-all"><X size={28}/></button>
                </div>
                <div className="overflow-y-auto flex-1 p-6 md:p-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allClubRegs.filter(r => r.clubId === viewingClub.id).map(r => (
                            <div key={r.id} className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center border border-transparent hover:bg-white hover:border-bde-navy/20 transition-all">
                                <span className="text-sm font-bold text-gray-800">{r.studentName}</span>
                                <span className="text-[10px] bg-bde-navy/10 text-bde-navy px-2 py-0.5 rounded-lg font-black uppercase">{r.studentLevel}</span>
                            </div>
                        ))}
                        {allClubRegs.filter(r => r.clubId === viewingClub.id).length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-400 italic">Aucun membre répertorié pour ce club.</div>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-gray-50 border-t flex justify-center">
                    <button onClick={resetModals} className="px-10 py-4 bg-bde-navy text-white rounded-2xl font-black hover:bg-bde-rose transition-all shadow-lg active:scale-95">Fermer la liste</button>
                </div>
              </div>
          </div>
      )}

      {/* MODAL INSCRIPTION CLUBS ANNUELS */}
      {selectedClub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 relative my-auto border-4 border-bde-navy/10">
            <button onClick={resetModals} className="absolute top-6 right-6 p-2 bg-gray-100 text-gray-500 hover:text-bde-navy hover:bg-gray-200 rounded-full transition-all"><X size={28}/></button>
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8"><Check size={48} /></div>
                <h3 className="text-3xl font-black text-bde-navy mb-4">Bienvenue !</h3>
                <p className="text-gray-500 font-medium mb-10">Ton inscription au club <strong>{selectedClub.name}</strong> a bien été reçue. Le responsable te contactera bientôt.</p>
                <button onClick={resetModals} className="w-full bg-bde-navy text-white py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-lg">Super, merci !</button>
              </div>
            ) : (
              <>
                <h3 className="text-3xl font-black text-bde-navy mb-8 leading-tight">Rejoindre {selectedClub.name}</h3>
                <form onSubmit={(e) => handleRegister(e, false)} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Ton Nom Complet</label>
                    <input type="text" required className={inputStyle} value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Prénom Nom" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Ton Niveau</label>
                    <select className={inputStyle} value={studentLevel} onChange={e => setStudentLevel(e.target.value)}>{levels.map(l => <option key={l} value={l}>{l}</option>)}</select>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-bde-navy text-white py-5 rounded-[24px] font-black text-lg hover:bg-rose-600 transition-all shadow-xl shadow-blue-900/20">{loading ? 'Envoi...' : 'Valider mon inscription'}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Clubs;
