
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Member } from '../../types';
import { Plus, Trash2, Edit, X, User, Upload } from 'lucide-react';

const AdminMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const inputStyle = "w-full bg-bde-navy text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-bde-rose outline-none placeholder-gray-400";

  const loadData = async () => {
    const data = await dataService.fetchMembers();
    setMembers(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      setName(member.name);
      setRole(member.role);
      setWhatsapp(member.whatsapp);
      setPhotoUrl(member.photoUrl);
    } else {
      setEditingMember(null);
      setName('');
      setRole('');
      setWhatsapp('');
      setPhotoUrl('https://ui-avatars.com/api/?name=New+Member&background=0F1E3A&color=fff');
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    const newList = await dataService.deleteMember(id);
    setMembers(newList);
    setDeleteConfirmId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
        const updated = {
            ...editingMember, name, role, whatsapp, photoUrl
        };
        const newList = await dataService.updateMember(updated);
        setMembers(newList);
    } else {
        const newMember = {
            name, role, whatsapp, photoUrl
        };
        const newList = await dataService.addMember(newMember);
        setMembers(newList);
    }
    setIsModalOpen(false);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Membres</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-bde-rose text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition shadow-lg">
          <Plus size={18} /> Ajouter un membre
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
           <thead className="bg-gray-50 text-gray-500 text-sm">
             <tr>
               <th className="p-4">Membre</th>
               <th className="p-4">Rôle</th>
               <th className="p-4">WhatsApp</th>
               <th className="p-4 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {members.map(member => (
               <tr key={member.id} className="hover:bg-gray-50 transition">
                 <td className="p-4 flex items-center gap-3">
                    <img src={member.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200 border" />
                    <span className="font-bold text-gray-800">{member.name}</span>
                 </td>
                 <td className="p-4 text-sm text-gray-600">{member.role}</td>
                 <td className="p-4 text-sm text-gray-500">{member.whatsapp}</td>
                 <td className="p-4 text-right">
                   <div className="flex justify-end gap-2">
                     <button type="button" onClick={() => openModal(member)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit size={16}/></button>
                     
                     {deleteConfirmId === member.id ? (
                        <button type="button" onClick={() => handleConfirmDelete(member.id)} className="px-2 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 transition">Confirmer</button>
                     ) : (
                        <button type="button" onClick={() => { setDeleteConfirmId(member.id); setTimeout(() => setDeleteConfirmId(null), 3000); }} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={16}/></button>
                     )}
                   </div>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-lg text-bde-navy">{editingMember ? 'Modifier' : 'Ajouter Membre'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="flex justify-center mb-4">
                 <img src={photoUrl || 'https://via.placeholder.com/100'} alt="Preview" className="w-24 h-24 rounded-full bg-gray-100 object-cover border-4 border-white shadow-md" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom Complet</label>
                <input type="text" className={inputStyle} value={name} onChange={e => setName(e.target.value)} required placeholder="Nom et Prénoms" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Rôle</label>
                <input type="text" className={inputStyle} value={role} onChange={e => setRole(e.target.value)} required placeholder="Ex: Trésorier" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp (sans +)</label>
                <input type="text" className={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required placeholder="Ex: 22507..." />
              </div>

              <div className="border-t pt-4 mt-2">
                <label className="block text-sm font-bold mb-2 text-gray-700">Photo de profil</label>
                <div className="space-y-3">
                    <input type="text" placeholder="URL directe (optionnel)" className={inputStyle} value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
                    
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:bg-gray-50 transition cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                           <Upload size={16} /> <span className="text-sm">Importer depuis l'appareil</span>
                        </div>
                    </div>
                </div>
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

export default AdminMembers;
