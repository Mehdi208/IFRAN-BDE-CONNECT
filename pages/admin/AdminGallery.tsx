import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Club, GalleryItem } from '../../types';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  Loader2, 
  CheckSquare, 
  Square, 
  X, 
  FolderPlus, 
  Filter,
  Sparkles
} from 'lucide-react';

const AdminGallery = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 'all' allows seeing everything across the campus
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form state
  const [formClubId, setFormClubId] = useState<string>('');
  const [eventName, setEventName] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Mass deletion state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clubsData, galleryData] = await Promise.all([
        dataService.fetchClubs(),
        dataService.fetchGalleryItems()
      ]);
      setClubs(clubsData);
      setGalleryItems(galleryData);
      if (clubsData.length > 0 && !formClubId) {
        setFormClubId(clubsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching gallery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await dataService.uploadImage(files[i]);
        newUrls.push(base64);
      }
      setMediaUrls(prev => [...prev, ...newUrls]);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erreur lors de l'upload des images");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClub = formClubId || (clubs[0]?.id || 'general');
    if (!targetClub || !eventName || mediaUrls.length === 0) {
      alert("Veuillez remplir tous les champs et ajouter au moins un média.");
      return;
    }

    try {
      const newItems: Omit<GalleryItem, 'id'>[] = mediaUrls.map(url => ({
        clubId: targetClub,
        eventName: eventName.trim(),
        type: mediaType,
        url: url,
        createdAt: new Date().toISOString()
      }));
      
      const updatedItems = await dataService.addGalleryItems(newItems);
      setGalleryItems(updatedItems);
      setMediaUrls([]);
      setIsAddModalOpen(false);
      setEventName('');
    } catch (error) {
      console.error("Error adding media:", error);
      alert("Erreur lors de l'ajout du média");
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer le média',
      message: 'Êtes-vous sûr de vouloir supprimer ce média ?',
      onConfirm: async () => {
        try {
          const updatedItems = await dataService.deleteGalleryItem(id);
          setGalleryItems(updatedItems);
          setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
        } catch (error) {
          console.error("Error deleting media:", error);
          alert("Erreur lors de la suppression");
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleMassDelete = async () => {
    if (selectedItemIds.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Suppression en masse',
      message: `Êtes-vous sûr de vouloir supprimer ces ${selectedItemIds.length} médias ?`,
      onConfirm: async () => {
        try {
          const updatedItems = await dataService.deleteGalleryItems(selectedItemIds);
          setGalleryItems(updatedItems);
          setSelectedItemIds([]);
          setIsSelectionMode(false);
        } catch (error) {
          console.error("Error deleting media:", error);
          alert("Erreur lors de la suppression en masse");
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (eventId: string, items: GalleryItem[]) => {
    const eventItemIds = items.map(item => item.id);
    const allSelected = eventItemIds.every(id => selectedItemIds.includes(id));
    
    if (allSelected) {
      setSelectedItemIds(prev => prev.filter(id => !eventItemIds.includes(id)));
    } else {
      setSelectedItemIds(prev => {
        const newIds = [...prev];
        eventItemIds.forEach(id => {
          if (!newIds.includes(id)) newIds.push(id);
        });
        return newIds;
      });
    }
  };

  // Group items by club or all
  const filteredItems = selectedClubId === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.clubId === selectedClubId);

  const eventsInFilter = Array.from(new Set(filteredItems.map(item => item.eventName)));

  const getClubName = (clubId: string) => {
    const c = clubs.find(item => item.id === clubId);
    return c ? c.name : 'Événement Campus';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Top Header matching all admin pages */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-bde-navy dark:text-white flex items-center gap-2">
              <ImageIcon className="text-bde-rose" size={28} />
              <span>Gestion de la Galerie</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Photos et vidéos des activités, soirées et clubs du BDE
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-bde-rose hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-rose-900/20 transition transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              <Plus size={18} />
              <span>Ajouter des Médias</span>
            </button>
          </div>
        </div>

        {/* Filters and Selection bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-gray-400 dark:text-gray-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Filtrer par club :</span>
            <select
              value={selectedClubId}
              onChange={(e) => {
                setSelectedClubId(e.target.value);
                setSelectedItemIds([]);
              }}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-bde-rose"
            >
              <option value="all">Tous les clubs & activités ({galleryItems.length})</option>
              {clubs.map(club => {
                const count = galleryItems.filter(i => i.clubId === club.id).length;
                return (
                  <option key={club.id} value={club.id}>
                    {club.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {isSelectionMode && selectedItemIds.length > 0 && (
              <button
                onClick={handleMassDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 size={15} />
                <span>Supprimer ({selectedItemIds.length})</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedItemIds([]);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                isSelectionMode 
                  ? 'bg-bde-rose text-white border-bde-rose shadow-sm' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {isSelectionMode ? 'Terminer la sélection' : 'Sélection multiple'}
            </button>
          </div>
        </div>

        {/* Gallery Content */}
        {loading ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-xl text-center border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-bde-rose mb-3" size={36} />
            <span className="text-sm text-gray-500 dark:text-gray-400">Chargement des médias de la galerie...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-xl text-center border border-gray-100 dark:border-slate-700 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-bde-rose flex items-center justify-center mx-auto">
              <ImageIcon size={32} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Aucun média trouvé</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedClubId === 'all' 
                  ? "La galerie est vide. Cliquez sur « Ajouter des Médias » pour importer des photos ou vidéos."
                  : "Aucun média enregistré pour ce club en particulier. Changez de filtre ou ajoutez des photos."}
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-bde-rose text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-600 transition"
            >
              <Plus size={16} /> Importer des photos
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {eventsInFilter.map(eventName => {
              const eventItems = filteredItems.filter(item => item.eventName === eventName);
              const allEventItemsSelected = eventItems.length > 0 && eventItems.every(item => selectedItemIds.includes(item.id));
              const clubName = eventItems[0] ? getClubName(eventItems[0].clubId) : '';

              return (
                <div key={eventName} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-bde-rose rounded-full"></span>
                        <h3 className="text-lg font-bold text-bde-navy dark:text-white">
                          {eventName}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                          {clubName}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({eventItems.length} média{eventItems.length > 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>

                    {isSelectionMode && (
                      <button 
                        onClick={() => toggleSelectAll(eventName, eventItems)}
                        className="text-xs font-semibold flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-bde-rose transition-colors"
                      >
                        {allEventItemsSelected ? <CheckSquare size={16} className="text-bde-rose" /> : <Square size={16} />}
                        Tout sélectionner
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {eventItems.map(item => {
                      const isSelected = selectedItemIds.includes(item.id);

                      return (
                        <div 
                          key={item.id} 
                          className={`group relative rounded-xl overflow-hidden border aspect-square bg-gray-50 dark:bg-slate-900 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-bde-rose ring-2 ring-bde-rose shadow-md' 
                              : 'border-gray-200 dark:border-slate-700 hover:border-bde-rose/50'
                          }`}
                          onClick={() => isSelectionMode && toggleSelection(item.id)}
                        >
                          {item.type === 'photo' ? (
                            <img 
                              src={item.url} 
                              alt={item.eventName} 
                              className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${isSelected ? 'opacity-80' : ''}`} 
                            />
                          ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center ${isSelected ? 'opacity-80' : ''}`}>
                              <Video size={32} className="mb-2 text-rose-500" />
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 break-all line-clamp-2">{item.url}</span>
                            </div>
                          )}

                          {isSelectionMode ? (
                            <div className="absolute top-2 left-2 z-10 bg-white dark:bg-slate-800 rounded-md shadow-sm p-0.5">
                              {isSelected ? (
                                <CheckSquare size={20} className="text-bde-rose" />
                              ) : (
                                <Square size={20} className="text-gray-400" />
                              )}
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleDelete(item.id); 
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-transform transform hover:scale-110 shadow-lg"
                                title="Supprimer ce média"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Ajouter des médias */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-slate-700 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <FolderPlus size={22} className="text-bde-rose" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Ajouter des photos / vidéos à la Galerie
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddMedia} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                      Club / Entité rattachée
                    </label>
                    <select
                      value={formClubId}
                      onChange={(e) => setFormClubId(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-bde-rose"
                      required
                    >
                      {clubs.map(club => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                      Thème / Nom de l'événement
                    </label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Ex: Soirée d'intégration, Match foot, Défilé"
                      className="w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-bde-rose"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                    Type de média
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 font-medium">
                      <input
                        type="radio"
                        checked={mediaType === 'photo'}
                        onChange={() => { setMediaType('photo'); setMediaUrls([]); setVideoUrlInput(''); }}
                        className="text-bde-rose focus:ring-bde-rose"
                      />
                      <ImageIcon size={18} className="text-bde-rose" /> Photos
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 font-medium">
                      <input
                        type="radio"
                        checked={mediaType === 'video'}
                        onChange={() => { setMediaType('video'); setMediaUrls([]); setVideoUrlInput(''); }}
                        className="text-bde-rose focus:ring-bde-rose"
                      />
                      <Video size={18} className="text-bde-rose" /> Vidéo (YouTube / Drive)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    {mediaType === 'photo' ? 'Importer les images depuis votre appareil' : 'Lien de la vidéo'}
                  </label>
                  {mediaType === 'photo' ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="w-full p-2.5 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-bde-rose file:text-white file:text-xs file:font-bold"
                        disabled={isUploading}
                      />
                      {isUploading && (
                        <div className="flex items-center gap-2 text-xs text-bde-rose font-medium">
                          <Loader2 className="animate-spin" size={16} /> Compression et préparation des photos...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://youtube.com/watch?v=... ou https://drive.google.com/..."
                        className="flex-1 p-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-bde-rose"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (videoUrlInput.trim()) {
                            setMediaUrls(prev => [...prev, videoUrlInput.trim()]);
                            setVideoUrlInput('');
                          }
                        }}
                        className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition"
                      >
                        Ajouter
                      </button>
                    </div>
                  )}
                </div>

                {mediaUrls.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                      Aperçu des médias prêts ({mediaUrls.length}) :
                    </p>
                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      {mediaUrls.map((url, index) => (
                        <div key={index} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700">
                          {mediaType === 'photo' ? (
                            <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800 p-1 text-center">
                              <Video size={18} className="text-rose-500 mb-1" />
                              <span className="text-[9px] text-gray-400 truncate w-full">{url}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setMediaUrls(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition shadow"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || mediaUrls.length === 0}
                    className="bg-bde-rose hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    <span>Enregistrer dans la Galerie</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation modal */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-bde-navy dark:text-white mb-2">{confirmDialog.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{confirmDialog.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition shadow"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminGallery;
