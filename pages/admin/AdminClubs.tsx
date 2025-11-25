import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Club } from '../../types';
import { Plus, Trash2, Edit, MessageCircle, X, Check, AlertTriangle } from 'lucide-react';

const AdminClubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  
  // State for delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [leader, setLeader] = useState('');
  const [contact, setContact] = useState('');
  const [activities, setActivities] = useState('');

  // Styles
  const inputStyle = "w-full bg-bde-navy text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none transition placeholder-gray-400";
  const textAreaStyle = "w-full bg-bde-navy text-white border border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none transition h-24 resize-none placeholder-gray-400";

  useEffect(() => {
    setClubs(dataService.getClubs());
  }, []);

  const openModal = (club?: Club) => {
    if (club) {
      setEditingClub(club);
      setName(club.name);
      setDesc(club.description);
      setLeader(club.leaderName);
      setContact(club.leaderWhatsapp);
      setActivities(club.activities.join(', '));
    } else {
      setEditingClub(null);
      setName('');
      setDesc('');
      setLeader('');
      setContact('');
      setActivities('');
    }
    setIsModalOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    const newClubs = clubs.filter(c => c.id !== id);
    setClubs(newClubs);
    dataService.saveClubs(newClubs);
    setDeleteConfirmId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const actList = activities.split(',').map(s => s.trim()).filter(s => s !== '');
    
    let newClubs = [...clubs];
    if (editingClub) {
      newClubs = newClubs.map(c => c.id === editingClub.id ? {
        ...c, 
        name, description: desc, leaderName: leader, leaderWhatsapp: contact, activities: actList
      } : c);
    } else {
      newClubs.push({
        id: Date.now().toString(),
        name, description: desc, leaderName: leader, leaderWhatsapp: contact, activities: actList
      });
    }
    setClubs(newClubs);
    dataService.saveClubs(newClubs);
    setIsModalOpen(false);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Clubs</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-bde-rose text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition shadow-lg shadow-rose-200">
          <Plus size={18} /> Nouveau Club
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {clubs.map(club => (
          <div key={club.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-bde-navy">{club.name}</h3>
              <div className="flex gap-2 items-center">
                <button type="button" onClick={() => openModal(club)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"><Edit size={18}/></button>
                
                {deleteConfirmId === club.id ? (
                    <button 
                        type="button" 
                        onClick={() => handleConfirmDelete(club.id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded font-bold hover:bg-red-600 transition"
                    >
                        Confirmer ?
                    </button>
                ) : (
                    <button 
                        type="button" 
                        onClick={() => {
                            setDeleteConfirmId(club.id);
                            setTimeout(() => setDeleteConfirmId(null), 3000);
                        }} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                        <Trash2 size={18}/>
                    </button>
                )}
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-6 flex-1 leading-relaxed">{club.description}</p>
            
            <div className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-100 mt-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 font-medium">Responsable</span>
                <span className="font-bold text-gray-800">{club.leaderName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Contact</span>
                <a 
                   href={`https://wa.me/${club.leaderWhatsapp}`} 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center gap-1.5 text-green-600 font-bold hover:underline bg-green-100 px-2 py-0.5 rounded-md"
                >
                   <MessageCircle size={14} /> WhatsApp
                </a>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
                {club.activities.map((act, i) => (
                    <span key={i} className="text-xs bg-bde-navy/5 text-bde-navy border border-bde-navy/10 px-2.5 py-1 rounded-full font-medium">{act}</span>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-xl text-bde-navy">{editingClub ? 'Modifier le Club' : 'Créer un Club'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du Club</label>
                <input 
                  type="text" 
                  className={inputStyle}
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Ex: Club Informatique"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea 
                  className={textAreaStyle}
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                  placeholder="Brève description des objectifs du club..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">Responsable</label>
                   <input 
                    type="text" 
                    className={inputStyle}
                    value={leader} 
                    onChange={e => setLeader(e.target.value)} 
                    placeholder="Nom complet"
                    required 
                   />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp</label>
                   <input 
                    type="text" 
                    className={inputStyle}
                    value={contact} 
                    onChange={e => setContact(e.target.value)} 
                    placeholder="22507..."
                    required 
                   />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Activités (séparées par des virgules)</label>
                <input 
                  type="text" 
                  className={inputStyle}
                  value={activities} 
                  onChange={e => setActivities(e.target.value)} 
                  placeholder="Atelier, Tournoi, Conférence..." 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition">Annuler</button>
                 <button type="submit" className="bg-bde-navy text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-900 transition shadow-lg flex items-center gap-2">
                   <Check size={18} /> Sauvegarder
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminClubs;