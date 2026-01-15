
import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, Calendar as CalIcon, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Event } from '../types';

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = eventDate < today;

  return (
    <div className={`group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full border ${isPast ? 'border-gray-200 grayscale-[0.5] opacity-80' : 'border-bde-rose/20 transform hover:-translate-y-1'}`}>
      <div className="overflow-hidden relative">
        <div className={`absolute inset-0 z-10 ${isPast ? 'bg-gray-100/20' : 'bg-black/5 group-hover:bg-transparent transition-colors'}`}></div>
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-auto transition-transform duration-700 group-hover:scale-110 aspect-video object-cover"
        />
        <div className={`absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-bde-rose text-white animate-pulse'}`}>
          {isPast ? <CheckCircle size={12} /> : <Clock size={12} />}
          {isPast ? 'ARCHIVE' : 'PROCHAINEMENT'}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col relative">
        <div className={`${isPast ? 'text-gray-400' : 'text-bde-rose'} font-bold text-sm mb-2 flex items-center gap-2`}>
          <CalIcon size={14} />
          {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <h3 className={`text-xl font-bold mb-3 transition-colors ${isPast ? 'text-gray-600' : 'text-bde-navy group-hover:text-bde-rose'}`}>{event.title}</h3>
        <p className="text-gray-500 text-sm mb-4 flex-1">{event.description}</p>
        
        <div className="pt-4 border-t border-gray-100 flex items-center text-gray-400 text-sm">
          <MapPin size={16} className={`mr-2 ${isPast ? 'text-gray-300' : 'text-bde-rose'}`} />
          {event.location}
        </div>
      </div>
    </div>
  );
};

const VisualCalendar: React.FC<{ events: Event[] }> = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const getDayEvents = (day: number) => {
    return events.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getDate() === day && eDate.getMonth() === month && eDate.getFullYear() === year;
    });
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-12 reveal active hover:shadow-xl transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-2xl font-bold text-bde-navy flex items-center gap-2">
            <span className="bg-bde-navy/5 p-2 rounded-lg text-bde-rose"><CalIcon size={24}/></span>
            {monthNames[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-bde-navy hover:text-bde-rose border border-gray-100"><ChevronLeft size={24}/></button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-bde-navy hover:text-bde-rose border border-gray-100"><ChevronRight size={24}/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-400 py-2 uppercase tracking-widest">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24 sm:h-32 bg-gray-50/50 rounded-lg"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getDayEvents(day);
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          
          return (
            <div 
              key={day} 
              className={`h-24 sm:h-32 border rounded-lg p-1 sm:p-2 relative transition-all group overflow-hidden
                ${isToday 
                  ? 'bg-rose-50 border-bde-rose shadow-[0_0_10px_rgba(231,74,103,0.1)]' 
                  : 'bg-white border-gray-100 hover:border-bde-rose/30 hover:shadow-md'
                }`}
            >
              {dayEvents.length > 0 && (
                <div className="absolute inset-0 z-0">
                  <img src={dayEvents[0].imageUrl} alt="" className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-500" />
                </div>
              )}
              
              <div className="relative z-10 flex flex-col h-full">
                <span 
                  className={`text-xs sm:text-sm font-bold inline-block w-6 h-6 text-center leading-6 rounded-full 
                    ${isToday 
                      ? 'bg-bde-rose text-white shadow-sm'
                      : 'text-gray-700 group-hover:text-bde-rose'
                    }`}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                  {dayEvents.map(ev => {
                    const evDate = new Date(ev.date);
                    const now = new Date();
                    now.setHours(0,0,0,0);
                    const isEvPast = evDate < now;
                    return (
                      <div 
                        key={ev.id} 
                        className={`text-[8px] sm:text-[10px] leading-tight p-1 rounded font-bold truncate shadow-sm transform hover:scale-105 transition-transform cursor-pointer border
                          ${isEvPast ? 'bg-white/90 text-gray-500 border-gray-200' : 'bg-bde-rose/90 text-white border-bde-rose'}
                        `} 
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-gray-500 border-t pt-4">
         <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-bde-rose rounded"></div> À venir</div>
         <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-200 rounded"></div> Passé / Archivé</div>
         <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-bde-rose bg-rose-50 rounded"></div> Aujourd'hui</div>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await dataService.fetchEvents();
      setEvents(data);
    };
    load();
  }, []);

  const sortedEvents = useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filtrage dynamique basé sur la date réelle
      const upcoming = events
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
      const past = events
        .filter(e => new Date(e.date) < today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { upcoming, past };
  }, [events]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [events]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 reveal active">
          <h1 className="text-4xl font-bold text-bde-navy mb-4">Agenda Officiel</h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-medium">
            Explorez les temps forts de la vie étudiante. Grille interactive avec archivage automatique en temps réel.
          </p>
        </div>

        <VisualCalendar events={events} />

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-bde-navy mb-8 flex items-center gap-3 reveal active">
            <span className="w-2 h-8 bg-bde-rose rounded-full"></span>
            Prochainement sur le Campus
          </h2>
          {sortedEvents.upcoming.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedEvents.upcoming.map((event, idx) => (
                <div key={event.id} className="reveal" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 reveal">
              <CalIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Restez à l'écoute ! De nouvelles surprises arrivent.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-400 mb-8 flex items-center gap-3 reveal active">
            <span className="w-2 h-8 bg-gray-300 rounded-full"></span>
            Archives & Souvenirs
          </h2>
          {sortedEvents.past.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedEvents.past.map((event, idx) => (
                <div key={event.id} className="reveal" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">Aucun souvenir archivé pour le moment.</div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default CalendarPage;
