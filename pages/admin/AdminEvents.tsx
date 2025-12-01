
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Event, EventRegistration } from '../../types';
import { Plus, Trash2, Edit, X, Calendar, MapPin, Upload, Loader, Users } from 'lucide-react';

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- NOUVEAU : State pour voir les inscrits ---
  const [viewingRegistrationsEvent, setViewingRegistrationsEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

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

  const handleViewRegistrations = async (event: Event) => {
    setViewingRegistrationsEvent(event);
    setLoadingRegistrations(true);
    try {
        const regs = await dataService.fetchEventRegistrations(event.id);
        setRegistrations(regs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch(e) {
        console.error("Erreur chargement inscrits:", e);
    } finally {
        setLoadingRegistrations(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await dataService.uploadImage(file);
        setImageUrl(url);
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'image:", error);
        alert("Une erreur est survenue lors de l'envoi de l'image. Assurez-vous d'avoir activé Storage sur Firebase.");
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
                <button type="button" onClick={() => handleViewRegistrations(event)} className="flex-1 bg-gray-50 text-gray-600 py-2 rounded text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2">
                    <Users size={16} /> Inscrits
                </button>
                <button type="button" onClick={() => openModal(event)} className="bg-blue-50 text-blue-600 p-2 rounded hover:bg-blue-100 transition">
                  <Edit size={16}/>
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
            {/* ... form content as before ... */}
        </div>
      )}

      {/* MODAL LISTE DES INSCRITS */}
      {viewingRegistrationsEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                  <h3 className="font-bold text-xl text-bde-navy flex items-center gap-2">
                      <Users /> Inscriptions : {viewingRegistrationsEvent.title}
                  </h3>
                  <button onClick={() => setViewingRegistrationsEvent(null)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                </div>
                <div className="p-6 overflow-y-auto">
                   {loadingRegistrations ? (
                       <div className="flex justify-center items-center py-10"><span className="animate-spin h-8 w-8 border-4 border-bde-navy border-t-transparent rounded-full"></span></div>
                   ) : registrations.length > 0 ? (
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 text-gray-500 text-sm">
                              <tr>
                                  <th className="p-3">Date</th>
                                  <th className="p-3">Étudiant</th>
                                  <th className="p-3">Niveau</th>
                                  <th className="p-3">Contact</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {registrations.map(reg => (
                                  <tr key={reg.id}>
                                      <td className="p-3 text-sm text-gray-500">{new Date(reg.date).toLocaleDateString()}</td>
                                      <td className="p-3 font-bold text-gray-800">{reg.studentName}</td>
                                      <td className="p-3 text-sm">{reg.studentLevel}</td>
                                      <td className="p-3 text-green-600 font-medium">{reg.studentWhatsapp}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                   ) : (
                       <div className="text-center py-10 text-gray-500">Aucune inscription pour cet événement.</div>
                   )}
                </div>
            </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEvents;