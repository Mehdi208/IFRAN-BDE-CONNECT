
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Mentor } from '../../types';
import { Plus, Trash2, Edit, X, BookOpen, MessageCircle, GripVertical, Save, Loader } from 'lucide-react';

const AdminMentors = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const inputStyle = "w-full bg-bde-navy text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-bde-rose outline-none placeholder-gray-400";

  const loadData = async () => {
    const data = await dataService.fetchMentors();
    setMentors(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (mentor?: Mentor) => {
    if (mentor) {
      setEditingMentor(mentor);
      setName(mentor.name);
      setSubject(mentor.subject);
      setWhatsapp(mentor.whatsapp);
    } else {
      setEditingMentor(null);
      setName('');
      setSubject('');
      setWhatsapp('');
    }
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    await dataService.deleteMentor(id);
    loadData();
    setDeleteConfirmId(null);
  };
  
  const handleSaveOrder = async () => {
    setIsLoadingSave(true);
    await dataService.updateMentorsOrder(mentors);
    setIsOrderChanged(false);
    setIsLoadingSave(false);
    loadData();
  };

  // Drag & Drop Handlers
  const onDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.currentTarget.classList.add('bg-blue-50', 'shadow-lg');
  };

  const onDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
  };
  
  const onDrop = (e: React.DragEvent<HTMLTableRowElement>, dropIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-t-2', 'border-bde-rose');
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (dragIndex === dropIndex) return;

    const reordered = [...mentors];
    const [draggedItem] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    setMentors(reordered);
    setIsOrderChanged(true);
  };

  const onDragEnter = (e: React.DragEvent<HTMLTableRowElement>) => {
      e.currentTarget.classList.add('border-t-2', 'border-bde-rose');
  };
  
  const onDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
      e.currentTarget.classList.remove('border-t-2', 'border-bde-rose');
  };
  
  const onDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
      e.currentTarget.classList.remove('bg-blue-50', 'shadow-lg');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMentor) {
        const updated = {
            ...editingMentor, name, subject, whatsapp
        };
        await dataService.updateMentor(updated);
    } else {
        await dataService.addMentor({
            name, subject, whatsapp
        });
    }
    loadData();
    setIsModalOpen(false);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="text-bde-rose"/> Gestion des Mentors
            </h2>
            <p className="text-sm text-gray-500">Glissez-déposez les lignes pour changer l'ordre.</p>
        </div>
        <div className="flex gap-2">
            {isOrderChanged && (
                <button 
                    onClick={handleSaveOrder} 
                    disabled={isLoadingSave}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition shadow-lg disabled:opacity-50"
                >
                    {isLoadingSave ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} 
                    Sauvegarder l'ordre
                </button>
            )}
            <button onClick={() => openModal()} className="flex items-center gap-2 bg-bde-rose text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition shadow-lg">
                <Plus size={18} /> Ajouter un Mentor
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto animate-fade-in-up">
        <table className="w-full text-left min-w-[600px]">
           <thead className="bg-gray-50 text-gray-500 text-sm">
             <tr>
               <th className="p-4 w-12"></th>
               <th className="p-4">Mentor</th>
               <th className="p-4">Matière / Compétence</th>
               <th className="p-4">Contact</th>
               <th className="p-4 text-right">Actions</th>
             </tr>
           </thead>
           <tbody>
             {mentors.map((mentor, index) => (
               <tr 
                 key={mentor.id} 
                 draggable
                 onDragStart={(e) => onDragStart(e, index)}
                 onDragOver={onDragOver}
                 onDrop={(e) => onDrop(e, index)}
                 onDragEnter={onDragEnter}
                 onDragLeave={onDragLeave}
                 onDragEnd={onDragEnd}
                 className="hover:bg-gray-50 transition border-t-2 border-transparent cursor-grab active:cursor-grabbing"
               >
                 <td className="p-4 w-12 text-center text-gray-400">
                    <GripVertical size={16} />
                 </td>
                 <td className="p-4 font-bold text-gray-800">{mentor.name}</td>
                 <td className="p-4">
                     <span className="bg-blue-50 text-bde-navy px-3 py-1 rounded-full text-sm font-medium">
                         {mentor.subject}
                     </span>
                 </td>
                 <td className="p-4 text-sm text-gray-500 flex items-center gap-2">
                     <MessageCircle size={14} className="text-green-500"/> {mentor.whatsapp}
                 </td>
                 <td className="p-4 text-right whitespace-nowrap">
                   <div className="flex justify-end gap-2">
                     <button type="button" onClick={() => openModal(mentor)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"><Edit size={16}/></button>
                     
                     {deleteConfirmId === mentor.id ? (
                        <button type="button" onClick={() => handleConfirmDelete(mentor.id)} className="px-2 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 transition">Confirmer</button>
                     ) : (
                        <button type="button" onClick={() => { setDeleteConfirmId(mentor.id); setTimeout(() => setDeleteConfirmId(null), 3000); }} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"><Trash2 size={16}/></button>
                     )}
                   </div>
                 </td>
               </tr>
             ))}
             {mentors.length === 0 && (
                 <tr>
                     <td colSpan={5} className="p-8 text-center text-gray-500">Aucun mentor pour le moment.</td>
                 </tr>
             )}
           </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-lg text-bde-navy">{editingMentor ? 'Modifier' : 'Ajouter Mentor'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom Complet</label>
                <input type="text" className={inputStyle} value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Koffi Emmanuel" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Matière / Sujet</label>
                <input type="text" className={inputStyle} value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Ex: Mathématiques, Photoshop..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp (sans +)</label>
                <input type="text" className={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required placeholder="Ex: 22507..." />
              </div>

              <button type="submit" className="w-full bg-bde-navy text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition shadow-lg mt-4">
                Sauvegarder
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMentors;
