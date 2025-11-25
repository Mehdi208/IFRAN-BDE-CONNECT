import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Event } from '../../types';
import { Plus, Trash2, Edit, X, Calendar, MapPin, Upload } from 'lucide-react';

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // State for delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<'upcoming'|'past'|'cancelled'>('upcoming');
  const [imageUrl, setImageUrl] = useState('');

  // Styles
  const inputStyle = "w-full bg-bde-navy text-white border border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-bde-rose outline-none placeholder-gray-400";
  const selectStyle = "w-full bg-bde-navy text-white border border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-bde-rose outline-none";

  useEffect(() => {
    setEvents(dataService.getEvents());
  }, []);

  const openModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setTitle(event.title);
      setDate(event.date);
      setLocation(event.location);
      setDesc(event.description);
      setStatus(event.status as any);
      setImageUrl(event.imageUrl);
    } else {
      setEditingEvent(null);
      setTitle('');
      setDate('');
      setLocation('');
      setDesc('');
      setStatus('upcoming');
      setImageUrl('https://picsum.photos/800/400');
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDelete = (id: string) => {
    const newEvents = events.filter(e => e.id !== id);
    setEvents(newEvents);
    dataService.saveEvents(newEvents);
    setDeleteConfirmId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let newEvents = [...events];
    if (editingEvent) {
      newEvents = newEvents.map(ev => ev.id === editingEvent.id ? {
        ...ev, title, date, location, description: desc, status, imageUrl
      } : ev);
    } else {
      newEvents.push({
        id: Date.now().toString(),
        title, date, location, description: desc, status, imageUrl
      });
    }
    setEvents(newEvents);
    dataService.saveEvents(newEvents);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'upcoming': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'upcoming': return 'À venir';
      case 'cancelled': return 'Annulé';
      default: return 'Terminé';
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Événements</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-bde-rose text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition">
          <Plus size={18} /> Créer un événement
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="h-40 overflow-hidden relative group">
               <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
               <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded ${getStatusBadge(event.status)}`}>
                 {getStatusLabel(event.status)}
               </span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-bde-navy mb-2">{event.title}</h3>
              <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                 <Calendar size={14}/> {event.date}
              </div>
              <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                 <MapPin size={14}/> {event.location}
              </div>
              <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">{event.description}</p>
              
              <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                <button type="button" onClick={() => openModal(event)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2">
                  <Edit size={16}/> Éditer
                </button>
                
                {deleteConfirmId === event.id ? (
                     <button type="button" onClick={() => handleConfirmDelete(event.id)} className="flex-1 bg-red-500 text-white py-2 rounded text-sm font-medium hover:bg-red-600 transition flex items-center justify-center gap-2">
                       Confirmer ?
                     </button>
                ) : (
                    <button type="button" onClick={() => { setDeleteConfirmId(event.id); setTimeout(() => setDeleteConfirmId(null), 3000); }} className="flex-1 bg-red-50 text-red-600 py-2 rounded text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-2">
                      <Trash2 size={16}/> Suppr.
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50">
              <h3 className="font-bold text-xl text-bde-navy">{editingEvent ? 'Modifier' : 'Nouvel Événement'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Titre</label>
                <input type="text" className={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required placeholder="Titre de l'événement" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold mb-1 text-gray-700">Date</label>
                   <input type="date" className={inputStyle} value={date} onChange={e => setDate(e.target.value)} required />
                 </div>
                 <div>
                   <label className="block text-sm font-bold mb-1 text-gray-700">Statut</label>
                   <select className={selectStyle} value={status} onChange={(e: any) => setStatus(e.target.value)}>
                      <option value="upcoming" className="bg-bde-navy text-white">À venir</option>
                      <option value="past" className="bg-bde-navy text-white">Terminé</option>
                      <option value="cancelled" className="bg-bde-navy text-white">Annulé</option>
                   </select>
                 </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Lieu</label>
                <input type="text" className={inputStyle} value={location} onChange={e => setLocation(e.target.value)} required placeholder="Ex: Campus IFRAN" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Description</label>
                <textarea className={inputStyle} style={{height: '100px'}} value={desc} onChange={e => setDesc(e.target.value)} required placeholder="Description détaillée..."></textarea>
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-bold mb-2 text-gray-700">Image de l'événement</label>
                
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <input type="text" placeholder="URL de l'image (https://...)" className={inputStyle} value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                    </div>
                    
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                        <span className="text-sm text-gray-500 font-medium">Cliquez pour importer depuis votre appareil</span>
                    </div>
                </div>

                {imageUrl && (
                    <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Aperçu :</p>
                        <img src={imageUrl} alt="Preview" className="h-24 w-full object-cover rounded-lg border" />
                    </div>
                )}
              </div>

              <div className="pt-4">
                  <button type="submit" className="w-full bg-bde-navy text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition shadow-lg">
                    Sauvegarder
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEvents;