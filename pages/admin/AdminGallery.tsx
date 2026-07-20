import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { Club, GalleryItem } from '../../types';
import { Plus, Trash2, Image as ImageIcon, Video, Loader2, ArrowLeft, CheckSquare, Square } from 'lucide-react';

const AdminGallery = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClubId, setSelectedClubId] = useState<string>('');
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
      if (clubsData.length > 0) {
        setSelectedClubId(clubsData[0].id);
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
      // Réinitialiser l'input pour permettre de re-sélectionner des fichiers
      e.target.value = '';
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !eventName || mediaUrls.length === 0) {
      alert("Veuillez remplir tous les champs et ajouter au moins un média.");
      return;
    }

    try {
      const newItems: Omit<GalleryItem, 'id'>[] = mediaUrls.map(url => ({
        clubId: selectedClubId,
        eventName: eventName.trim(),
        type: mediaType,
        url: url,
        createdAt: new Date().toISOString()
      }));
      
      const updatedItems = await dataService.addGalleryItems(newItems);
      setGalleryItems(updatedItems);
      setMediaUrls([]);
      // Keep eventName and selectedClubId to easily add multiple media to the same event
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

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-bde-navy" size={48} /></div>;
  }

  // Group items by club, then by event
  const filteredItems = galleryItems.filter(item => item.clubId === selectedClubId);
  const eventsInClub = Array.from(new Set(filteredItems.map(item => item.eventName)));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-gray-600"
          title="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-bde-navy">Gestion de la Galerie</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-bde-navy">Ajouter un nouveau média</h2>
        <form onSubmit={handleAddMedia} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent bg-white text-gray-900"
                required
              >
                <option value="" disabled>Sélectionnez un club</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thème / Nom de l'événement</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ex: Soirée d'intégration 2024"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de média</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={mediaType === 'photo'}
                    onChange={() => { setMediaType('photo'); setMediaUrls([]); setVideoUrlInput(''); }}
                    className="text-bde-rose focus:ring-bde-rose"
                  />
                  <ImageIcon size={18} /> Photo
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={mediaType === 'video'}
                    onChange={() => { setMediaType('video'); setMediaUrls([]); setVideoUrlInput(''); }}
                    className="text-bde-rose focus:ring-bde-rose"
                  />
                  <Video size={18} /> Vidéo (YouTube/Drive)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mediaType === 'photo' ? 'Images' : 'Liens des vidéos (YouTube ou Google Drive)'}
              </label>
              {mediaType === 'photo' ? (
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    disabled={isUploading}
                  />
                  {isUploading && <Loader2 className="animate-spin text-bde-rose" size={20} />}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... ou https://drive.google.com/file/d/..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (videoUrlInput.trim()) {
                          setMediaUrls(prev => [...prev, videoUrlInput.trim()]);
                          setVideoUrlInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (videoUrlInput.trim()) {
                        setMediaUrls(prev => [...prev, videoUrlInput.trim()]);
                        setVideoUrlInput('');
                      }
                    }}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              )}
            </div>
          </div>

          {mediaUrls.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Aperçu ({mediaUrls.length} média{mediaUrls.length > 1 ? 's' : ''}) :</p>
              <div className="flex flex-wrap gap-4">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    {mediaType === 'photo' ? (
                      <img src={url} alt={`Preview ${index}`} className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                    ) : (
                      <div className="h-24 w-24 flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-gray-200 p-2 text-center">
                        <Video size={24} className="text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-500 break-all line-clamp-2">{url}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaUrls(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading || mediaUrls.length === 0}
              className="bg-bde-rose text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={20} />
              Ajouter à la galerie
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-bde-navy">Médias du club sélectionné</h2>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {isSelectionMode && selectedItemIds.length > 0 && (
              <button
                onClick={handleMassDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Supprimer ({selectedItemIds.length})
              </button>
            )}
            
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedItemIds([]);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                isSelectionMode 
                  ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' 
                  : 'bg-white text-bde-navy border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isSelectionMode ? 'Annuler la sélection' : 'Sélection multiple'}
            </button>

            <select
              value={selectedClubId}
              onChange={(e) => {
                setSelectedClubId(e.target.value);
                setSelectedItemIds([]);
              }}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent bg-white text-gray-900 min-w-[200px]"
            >
              <option value="" disabled>Sélectionnez un club</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>
        </div>

        {eventsInClub.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun média pour ce club.</p>
        ) : (
          <div className="space-y-8">
            {eventsInClub.map(eventName => {
              const eventItems = filteredItems.filter(item => item.eventName === eventName);
              const allEventItemsSelected = eventItems.length > 0 && eventItems.every(item => selectedItemIds.includes(item.id));
              
              return (
                <div key={eventName} className="border-t border-gray-100 pt-6 first:border-0 first:pt-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-bde-navy flex items-center gap-2">
                      <span className="w-2 h-6 bg-bde-rose rounded-full"></span>
                      {eventName}
                    </h3>
                    
                    {isSelectionMode && (
                      <button 
                        onClick={() => toggleSelectAll(eventName, eventItems)}
                        className="text-sm flex items-center gap-1 text-gray-600 hover:text-bde-navy transition-colors"
                      >
                        {allEventItemsSelected ? <CheckSquare size={16} className="text-bde-rose" /> : <Square size={16} />}
                        Tout sélectionner
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {eventItems.map(item => {
                      const isSelected = selectedItemIds.includes(item.id);
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`group relative rounded-lg overflow-hidden border aspect-square bg-gray-50 transition-all ${
                            isSelected ? 'border-bde-rose ring-2 ring-bde-rose ring-opacity-50' : 'border-gray-200'
                          }`}
                          onClick={() => isSelectionMode && toggleSelection(item.id)}
                        >
                          {item.type === 'photo' ? (
                            <img src={item.url} alt={item.eventName} className={`w-full h-full object-cover ${isSelected ? 'opacity-80' : ''}`} />
                          ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center ${isSelected ? 'opacity-80' : ''}`}>
                              <Video size={32} className="mb-2" />
                              <span className="text-xs break-all line-clamp-2">{item.url}</span>
                            </div>
                          )}
                          
                          {isSelectionMode ? (
                            <div className="absolute top-2 left-2 z-10 bg-white rounded-md shadow-sm">
                              {isSelected ? (
                                <CheckSquare size={24} className="text-bde-rose" />
                              ) : (
                                <Square size={24} className="text-gray-400" />
                              )}
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={20} />
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
      </div>

      {/* Custom Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-bde-navy mb-2">{confirmDialog.title}</h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
