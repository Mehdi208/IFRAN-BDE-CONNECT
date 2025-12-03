
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Event } from '../../types';
import { Plus, Trash2, Edit, X, Calendar, MapPin, Upload, Loader } from 'lucide-react';

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const loadData = async () => {
    const data = await dataService.fetchEvents();
    setEvents(data);
  };

  useEffect(() => {
    loadData();
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressedUrl = await dataService.uploadImage(file);
        setImageUrl(compressedUrl);
      } catch (error: any) {
        console.error("Erreur d'upload:", error);
        alert(`Une erreur est survenue lors du traitement de l'image: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleConfirmDelete = async (id: string) => {
    const newList = await dataService.deleteEvent(id);
    setEvents(newList);
    setDeleteConfirmId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
        const updated = {
            ...editingEvent, title, date, location, description: desc, status, imageUrl
        };
        const newList = await dataService.updateEvent(updated);
        setEvents(newList);
    } else {
        const newEvent = {
            title, date, location, description: desc, status, imageUrl
        };
        const newList = await dataService.addEvent(newEvent);
        setEvents(newList);
    }
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
                  <Edit size={16}/> Modifier
                </button>
                {deleteConfirmId === event.id ? (
                     <button type="button" onClick={() => handleConfirmDelete(event.id)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition">
                       Confirmer?
                     </button>
                ) : (
                    <button type="button" onClick={() => { setDeleteConfirmId(event.id); setTimeout(() => setDeleteConfirmId(null), 3000); }} className="bg-red-50 text-red-600 p-2 rounded hover:bg-red-100 transition">
                      <Trash2 size={16}/>
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL AJOUT/MODIFICATION ÉVÉNEMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
              <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                  <h3 className="font-bold text-lg text-bde-navy">{editingEvent ? 'Modifier' : 'Ajouter'} un Événement</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Titre</label>
                    <input type="text" required className={inputStyle} value={title} onChange={e => setTitle(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                        <input type="date" required className={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Lieu</label>
                        <input type="text" required className={inputStyle} value={location} onChange={e => setLocation(e.target.value)} />
                      </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea required className={inputStyle + ' h-24'} value={desc} onChange={e => setDesc(e.target.value)}></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Statut</label>
                    <select className={selectStyle} value={status} onChange={e => setStatus(e.target.value as any)}>
                        <option value="upcoming">À venir</option>
                        <option value="past">Terminé</option>
                        <option value="cancelled">Annulé</option>
                    </select>
                  </div>

                  <div className="border-t pt-4">
                    <label className="block text-sm font-bold mb-2 text-gray-700">Image de l'événement</label>
                    <div className="space-y-3">
                        <input type="text" placeholder="URL directe (ou importez ci-dessous)" className={inputStyle} value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                        
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:bg-gray-50 transition cursor-pointer">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
                            <div className="flex items-center justify-center gap-2 text-gray-500">
                              {isUploading ? (
                                  <Loader size={16} className="animate-spin" />
                              ) : (
                                  <Upload size={16} />
                              )}
                              <span className="text-sm">{isUploading ? "Compression..." : "Importer & Compresser"}</span>
                            </div>
                        </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-bde-navy text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition shadow-lg mt-4" disabled={isUploading}>
                    Sauvegarder
                  </button>
              </form>
            </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminEvents;
