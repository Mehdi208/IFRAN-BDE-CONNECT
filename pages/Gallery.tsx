import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dataService } from '../services/dataService';
import { Club, GalleryItem } from '../types';
import { Loader2, Image as ImageIcon, Video, Play, ChevronLeft, ChevronRight, X } from 'lucide-react';

const Gallery = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClubId, setActiveClubId] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubsData, galleryData] = await Promise.all([
          dataService.fetchClubs(),
          dataService.fetchGalleryItems()
        ]);
        
        // Only show clubs that have gallery items
        const clubsWithMedia = clubsData.filter(club => 
          galleryData.some(item => item.clubId === club.id)
        );
        
        setClubs(clubsWithMedia);
        setGalleryItems(galleryData);
        
        if (clubsWithMedia.length > 0) {
          setActiveClubId(clubsWithMedia[0].id);
        }
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Helper to extract Google Drive ID
  const getGoogleDriveId = (url: string) => {
    const regExp = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const activeClubItems = galleryItems.filter(item => item.clubId === activeClubId);
  const eventsInClub = Array.from(new Set(activeClubItems.map(item => item.eventName)));

  // Lightbox navigation
  const selectedIndex = selectedMedia ? activeClubItems.findIndex(item => item.id === selectedMedia.id) : -1;

  const handlePrevious = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedIndex > 0) {
      setSelectedMedia(activeClubItems[selectedIndex - 1]);
    } else if (selectedIndex === 0) {
      setSelectedMedia(activeClubItems[activeClubItems.length - 1]); // Loop to end
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedIndex < activeClubItems.length - 1) {
      setSelectedMedia(activeClubItems[selectedIndex + 1]);
    } else if (selectedIndex === activeClubItems.length - 1) {
      setSelectedMedia(activeClubItems[0]); // Loop to start
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedMedia) return;
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setSelectedMedia(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, activeClubItems, selectedIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <Loader2 className="animate-spin text-bde-navy" size={48} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 reveal active">
          <h1 className="text-4xl md:text-5xl font-extrabold text-bde-navy mb-4 tracking-tight">
            Galerie <span className="text-bde-rose">Multimédia</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Revivez les meilleurs moments de nos clubs à travers leurs photos et vidéos.
          </p>
        </div>

        {clubs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100 reveal active">
            <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun média disponible</h3>
            <p className="text-gray-500">La galerie est en cours d'alimentation. Revenez plus tard !</p>
          </div>
        ) : (
          <div className="space-y-8 reveal active">
            {/* Club Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {clubs.map(club => (
                <button
                  key={club.id}
                  onClick={() => setActiveClubId(club.id)}
                  className={`px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 shadow-sm
                    ${activeClubId === club.id 
                      ? 'bg-bde-navy text-white scale-105' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                  {club.emoji && <span className="mr-2">{club.emoji}</span>}
                  {club.name}
                </button>
              ))}
            </div>

            {/* Event Sections */}
            <div className="space-y-16">
              {eventsInClub.map(eventName => (
                <div key={eventName} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold text-bde-navy mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                    <span className="w-3 h-8 bg-bde-rose rounded-full"></span>
                    {eventName}
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeClubItems.filter(item => item.eventName === eventName).map(item => {
                      const ytId = item.type === 'video' ? getYouTubeId(item.url) : null;
                      const driveId = item.type === 'video' ? getGoogleDriveId(item.url) : null;
                      
                      return (
                        <div 
                          key={item.id} 
                          className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 aspect-square bg-gray-100 cursor-pointer"
                          onClick={() => setSelectedMedia(item)}
                        >
                          {item.type === 'photo' ? (
                            <img 
                              src={item.url} 
                              alt={item.eventName} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full relative">
                              {ytId ? (
                                <img 
                                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                  alt="Video thumbnail"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : driveId ? (
                                <img 
                                  src={`https://drive.google.com/thumbnail?id=${driveId}&sz=w800`}
                                  alt="Video thumbnail"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <Video size={48} className="text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                  <Play className="text-bde-rose ml-1" size={24} fill="currentColor" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-8 animate-fade-in" onClick={() => setSelectedMedia(null)}>
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedMedia(null); }}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[110] bg-black/50 p-2 rounded-full"
          >
            <X size={24} />
          </button>
          
          {/* Navigation Arrows */}
          {activeClubItems.length > 1 && (
            <>
              <button 
                onClick={handlePrevious}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 transition-all z-[110] bg-black/50 p-3 rounded-full"
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 transition-all z-[110] bg-black/50 p-3 rounded-full"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          
          <div className="w-full max-w-5xl max-h-full flex flex-col items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === 'photo' ? (
              <img 
                src={selectedMedia.url} 
                alt={selectedMedia.eventName} 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
              />
            ) : (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                {getYouTubeId(selectedMedia.url) ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${getYouTubeId(selectedMedia.url)}?autoplay=1`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                ) : getGoogleDriveId(selectedMedia.url) ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://drive.google.com/file/d/${getGoogleDriveId(selectedMedia.url)}/preview`} 
                    title="Google Drive video player" 
                    frameBorder="0" 
                    allow="autoplay; fullscreen" 
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-8 text-center">
                    <Video size={64} className="mb-4 text-gray-500" />
                    <p className="mb-4">Cette vidéo ne peut pas être lue directement ici.</p>
                    <a 
                      href={selectedMedia.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-bde-rose text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-colors"
                    >
                      Ouvrir le lien
                    </a>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 text-center">
              <h3 className="text-white font-bold text-xl">{selectedMedia.eventName}</h3>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Gallery;
