
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Atelier, ClubRegistration } from '../../types';
import { Plus, Trash2, Edit, X, Check, Eye, MapPin, Loader, GripVertical, Save, Sparkles, PlusCircle, UserPlus, Info, Users, RotateCcw, AlertTriangle } from 'lucide-react';

const AdminAteliers = () => {
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAtelier, setEditingAtelier] = useState<Atelier | null>(null);
  
  // Gestion des participants
  const [viewingRegistrations, setViewingRegistrations] = useState<string | null>(null); // Atelier ID
  const [registrations, setRegistrations] = useState<ClubRegistration[]>([]);
  const [editingRegId, setEditingRegId] = useState<string | null>(null);
  const [showAddParticipantForm, setShowAddParticipantForm] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartLevel, setNewPartLevel] = useState('Prépa 1');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [regDeleteConfirmId, setRegDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGlobalResetConfirm, setShowGlobalResetConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  const [isLoadingSaveOrder, setIsLoadingSaveOrder] = useState(false);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [room, setRoom] = useState('');
  const [emoji, setEmoji] = useState('');

  const inputStyle = "w-full bg-bde-navy text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-bde-rose outline-none transition";
  const textAreaStyle = "w-full bg-bde-navy text-white border border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-bde-rose outline-none transition h-32 resize-none";
  const levels = ["Prépa 1", "Prépa 2", "B2 COM", "B2 CREA", "B2 DEV", "B3 COM", "B3 CREA", "B3 DEV", "Master 1", "Master 2"];

  const loadData = async () => {
    try {
        const data = await dataService.fetchAteliers();
        setAteliers(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (a?: Atelier) => {
    if (a) {
      setEditingAtelier(a);
      setName(a.name);
      setDesc(a.description);
      setRoom(a.room);
      setEmoji(a.emoji);
    } else {
      setEditingAtelier(null);
      setName(''); setDesc(''); setRoom(''); setEmoji('✨');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = { name, description: desc, room, emoji };
    
    try {
        if (editingAtelier) await dataService.updateAtelier({ ...editingAtelier, ...data });
        else await dataService.addAtelier(data);
        await loadData();
        setIsModalOpen(false);
    } catch (err: any) {
        alert("Erreur lors de l'enregistrement.");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    await dataService.deleteAtelier(id);
    await loadData();
    setDeleteConfirmId(null);
  };

  const handleSaveOrder = async () => {
    setIsLoadingSaveOrder(true);
    try {
      await dataService.updateAteliersOrder(ateliers);
      setIsOrderChanged(false);
      await loadData();
    } catch (e) { console.error(e); } finally { setIsLoadingSaveOrder(false); }
  };

  const handleGlobalReset = async () => {
      setLoading(true);
      await dataService.wipeAllAteliersRegistrations();
      await loadData();
      setLoading(false);
      setShowGlobalResetConfirm(false);
      alert("Toutes les inscriptions aux ateliers ont été supprimées.");
  };

  // --- LOGIQUE PARTICIPANTS ---

  const handleViewRegistrations = async (id: string) => {
    setViewingRegistrations(id);
    const regs = await dataService.fetchClubRegistrations(id, true);
    setRegistrations(regs);
    setEditingRegId(null);
    setShowAddParticipantForm(false);
    setShowResetConfirm(false);
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName || !viewingRegistrations) return;
    setLoading(true);
    await dataService.registerToClub({
        atelierId: viewingRegistrations,
        studentName: newPartName,
        studentLevel: newPartLevel,
        date: new Date().toISOString(),
        isAtelier: true
    });
    setNewPartName('');
    setShowAddParticipantForm(false);
    await handleViewRegistrations(viewingRegistrations);
    setLoading(false);
  };

  const handleDeleteRegistration = async (id: string) => {
    await dataService.deleteClubRegistration(id);
    if (viewingRegistrations) await handleViewRegistrations(viewingRegistrations);
    setRegDeleteConfirmId(null);
  };

  const handleResetRegistrations = async () => {
      if (!viewingRegistrations) return;
      setLoading(true);
      await dataService.resetAtelierRegistrations(viewingRegistrations);
      await handleViewRegistrations(viewingRegistrations);
      setLoading(false);
      setShowResetConfirm(false);
  };

  const handleUpdateParticipantLevel = async (reg: ClubRegistration, newLevel: string) => {
      const updated = { ...reg, studentLevel: newLevel };
      await dataService.updateClubRegistration(updated);
      if (viewingRegistrations) await handleViewRegistrations(viewingRegistrations);
      setEditingRegId(null);
  };

  // Drag & Drop Order
  const onDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.currentTarget.classList.add('bg-blue-50');
  };
  const onDragOver = (e: React.DragEvent<HTMLTableRowElement>) => e.preventDefault();
  const onDrop = (e: React.DragEvent<HTMLTableRowElement>, dropIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-t-2', 'border-bde-rose');
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (dragIndex === dropIndex) return;
    const reordered = [...ateliers];
    const [draggedItem] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);
    setAteliers(reordered);
    setIsOrderChanged(true);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Ateliers (Afternoon Day Club)</h2>
          <p className="text-sm text-gray-500">Glissez-déposez pour réorganiser l'ordre d'affichage public.</p>
        </div>
        <div className="flex gap-2">
            {!showGlobalResetConfirm ? (
                <button onClick={() => setShowGlobalResetConfirm(true)} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-200 transition flex items-center gap-2 border border-orange-200">
                   <RotateCcw size={18} /> Reset Global
                </button>
            ) : (
                <button onClick={handleGlobalReset} disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 animate-pulse">
                   {loading ? <Loader className="animate-spin" size={18}/> : <AlertTriangle size={18} />} Confirmer Reset GLOBAL ?
                </button>
            )}
            {isOrderChanged && (
                <button onClick={handleSaveOrder} disabled={isLoadingSaveOrder} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2 shadow-lg disabled:opacity-50">
                    {isLoadingSaveOrder ? <Loader className="animate-spin" size={18}/> : <Save size={18} />} Sauvegarder l'ordre
                </button>
            )}
            <button onClick={() => openModal()} className="bg-bde-rose text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition flex items-center gap-2 shadow-lg">
                <Plus size={18} /> Nouvel Atelier
            </button>
        </div>
      </div>

      {showGlobalResetConfirm && (
          <div className="mb-6 bg-orange-50 border-2 border-orange-200 p-4 rounded-xl flex justify-between items-center animate-fade-in">
              <div className="flex items-center gap-3">
                  <AlertTriangle className="text-orange-600" />
                  <p className="text-orange-800 text-sm font-bold">Attention : Cela supprimera TOUTES les inscriptions de TOUS les ateliers. Opération irréversible.</p>
              </div>
              <button onClick={() => setShowGlobalResetConfirm(false)} className="text-orange-400 hover:text-orange-600 font-bold text-xs uppercase underline">Annuler</button>
          </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
           <thead className="bg-gray-50 text-gray-500 text-sm">
             <tr>
               <th className="p-4 w-12"></th>
               <th className="p-4">Atelier</th>
               <th className="p-4">Lieu</th>
               <th className="p-4">Description</th>
               <th className="p-4 text-right">Actions</th>
             </tr>
           </thead>
           <tbody>
             {ateliers.map((a, index) => (
               <tr 
                 key={a.id} 
                 draggable
                 onDragStart={(e) => onDragStart(e, index)}
                 onDragOver={onDragOver}
                 onDrop={(e) => onDrop(e, index)}
                 onDragEnter={(e) => e.currentTarget.classList.add('border-t-2', 'border-bde-rose')}
                 onDragLeave={(e) => e.currentTarget.classList.remove('border-t-2', 'border-bde-rose')}
                 onDragEnd={(e) => e.currentTarget.classList.remove('bg-blue-50')}
                 className="hover:bg-gray-50 transition border-t-2 border-transparent cursor-grab active:cursor-grabbing"
               >
                 <td className="p-4 w-12 text-center text-gray-400">
                    <GripVertical size={16} />
                 </td>
                 <td className="p-4 flex items-center gap-3">
                    <span className="text-2xl">{a.emoji}</span>
                    <span className="font-bold text-gray-800 whitespace-nowrap">{a.name}</span>
                 </td>
                 <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-bold uppercase tracking-wide">
                        <MapPin size={12} /> {a.room}
                    </div>
                 </td>
                 <td className="p-4">
                    <p className="text-gray-500 text-sm italic line-clamp-1">"{a.description}"</p>
                 </td>
                 <td className="p-4 text-right whitespace-nowrap">
                   <div className="flex justify-end gap-2">
                     <button onClick={() => handleViewRegistrations(a.id)} className="p-2 text-bde-navy hover:bg-gray-100 rounded-lg transition" title="Gérer participants"><Eye size={18}/></button>
                     <button onClick={() => openModal(a)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={18}/></button>
                     {deleteConfirmId === a.id ? (
                        <button onClick={() => handleDelete(a.id)} className="px-2 py-1 bg-red-500 text-white text-xs rounded font-bold">Confirmer</button>
                     ) : (
                        <button onClick={() => { setDeleteConfirmId(a.id); setTimeout(() => setDeleteConfirmId(null), 3000); }} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"><Trash2 size={18}/></button>
                     )}
                   </div>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      {/* MODAL ATELIER CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50">
              <h3 className="font-bold text-xl text-bde-navy">{editingAtelier ? 'Modifier' : 'Créer'} Atelier</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={28}/></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nom</label>
                  <input type="text" className={inputStyle} value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Emoji</label>
                  <input type="text" className={inputStyle} value={emoji} onChange={e => setEmoji(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Salle</label>
                <input type="text" className={inputStyle} value={room} onChange={e => setRoom(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea className={textAreaStyle} value={desc} onChange={e => setDesc(e.target.value)} required></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 text-gray-500 font-medium">Annuler</button>
                <button type="submit" disabled={loading} className="bg-bde-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition flex items-center gap-2">
                  {loading ? <Loader className="animate-spin" size={18}/> : <Check size={18}/>} Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTION DES PARTICIPANTS */}
      {viewingRegistrations && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl text-bde-navy flex items-center gap-2">
                    <Users size={20}/> Participants ({registrations.length})
                </h3>
                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-tight">Atelier: {ateliers.find(a => a.id === viewingRegistrations)?.name}</p>
              </div>
              <div className="flex items-center gap-3">
                  {!showResetConfirm ? (
                      <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        title="Vider la liste"
                      >
                        <RotateCcw size={20}/>
                      </button>
                  ) : (
                      <button 
                        onClick={handleResetRegistrations}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse"
                      >
                        Confirmer le RESET ?
                      </button>
                  )}
                  <button onClick={() => setViewingRegistrations(null)} className="p-2 text-gray-400 hover:text-bde-navy"><X size={28}/></button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              
              {/* Formulaire ajout manuel */}
              {!showAddParticipantForm ? (
                  <button 
                    onClick={() => setShowAddParticipantForm(true)} 
                    className="w-full mb-6 border-2 border-dashed border-green-200 text-green-600 p-4 rounded-xl font-bold hover:bg-green-50 transition flex items-center justify-center gap-2"
                  >
                    <UserPlus size={20}/> Ajouter un étudiant manuellement
                  </button>
              ) : (
                  <form onSubmit={handleAddParticipant} className="mb-8 p-4 bg-green-50 rounded-xl border border-green-200 space-y-4 animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                          <h4 className="font-black text-green-800 text-sm uppercase">Nouvel Inscrit</h4>
                          <button type="button" onClick={() => setShowAddParticipantForm(false)} className="text-green-600"><X size={18}/></button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input type="text" placeholder="Nom Prénom" className={inputStyle} value={newPartName} onChange={e => setNewPartName(e.target.value)} required />
                          <select className={inputStyle} value={newPartLevel} onChange={e => setNewPartLevel(e.target.value)}>
                              {levels.map(l => <option key={l} value={l} className="bg-bde-navy">{l}</option>)}
                          </select>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
                          {loading ? <Loader className="animate-spin" size={16}/> : <Check size={18}/>} Confirmer l'ajout
                      </button>
                  </form>
              )}

              {registrations.length > 0 ? (
                <div className="space-y-3">
                  {registrations.map(r => (
                    <div key={r.id} className="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center hover:shadow-md transition group">
                      <div className="flex-1">
                        <span className="font-bold text-gray-800 block">{r.studentName}</span>
                        {editingRegId === r.id ? (
                            <div className="flex items-center gap-2 mt-2">
                                <select 
                                    className="bg-gray-100 border-none text-xs font-bold rounded p-1" 
                                    value={r.studentLevel}
                                    onChange={(e) => handleUpdateParticipantLevel(r, e.target.value)}
                                >
                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <button onClick={() => setEditingRegId(null)} className="text-gray-400 text-xs hover:underline">Annuler</button>
                            </div>
                        ) : (
                            <span className="text-[10px] bg-bde-rose/10 text-bde-rose px-2 py-0.5 rounded-lg font-black uppercase inline-block mt-1">
                                {r.studentLevel}
                            </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => setEditingRegId(r.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button>
                         {regDeleteConfirmId === r.id ? (
                             <button onClick={() => handleDeleteRegistration(r.id)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-bold">Confirmer</button>
                         ) : (
                             <button onClick={() => { setRegDeleteConfirmId(r.id); setTimeout(() => setRegDeleteConfirmId(null), 3000); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                  <Info size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Aucun participant répertorié.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 text-center">
                <button onClick={() => setViewingRegistrations(null)} className="bg-bde-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-bde-rose transition-all shadow-md">Fermer la gestion</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAteliers;
