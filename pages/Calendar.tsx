import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, Calendar as CalIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Event } from '../types';

const EventCard: React.FC<{ event: Event }> = ({ event }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-100 animate-fade-in-up">
    <div className="h-48 overflow-hidden relative">
      <img 
        src={event.imageUrl} 
        alt={event.title} 
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
      />
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-bde-navy shadow-sm">
        {event.status === 'upcoming' ? 'À venir' : 'Terminé'}
      </div>
    </div>
    <div className="p-6 flex-1 flex flex-col">
      <div className="text-bde-rose font-bold text-sm mb-2 flex items-center gap-2">
        <CalIcon size={14} />
        {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">{event.title}</h3>
      <p className="text-gray-600 text-sm mb-4 flex-1">{event.description}</p>
      
      <div className="pt-4 border-t border-gray-100 flex items-center text-gray-500 text-sm">
        <MapPin size={16} className="mr-2" />
        {event.location}
      </div>
    </div>
  </div>
);

const VisualCalendar: React.FC<{ events: Event[] }> = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)); // Defaulting to Oct 2025 where events are
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  // Adjust for Monday start (0 = Mon, 6 = Sun)
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
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-12 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-bde-navy">{monthNames[month]} {year}</h3>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
          <div key={d} className="text-center text-sm font-semibold text-gray-400 py-2">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24 bg-gray-50/50 rounded-lg"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getDayEvents(day);
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          
          return (
            <div key={day} className={`h-24 border rounded-lg p-2 relative transition-colors hover:border-bde-rose/50 ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
              <span className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</span>
              <div className="mt-1 space-y-1">
                {dayEvents.map(ev => (
                  <div key={ev.id} className="text-[10px] leading-tight bg-bde-rose/10 text-bde-rose p-1 rounded font-medium truncate" title={ev.title}>
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    setEvents(dataService.getEvents());
  }, []);

  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const pastEvents = events.filter(e => e.status === 'past');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-bde-navy mb-4">Agenda des Activités</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Retrouvez tous les événements marquants de l'année scolaire. Conférences, sport, fêtes et ateliers.
          </p>
        </div>

        {/* Visual Calendar */}
        <VisualCalendar events={events} />

        {/* Upcoming */}
        <section className="mb-16 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <h2 className="text-2xl font-bold text-bde-navy mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-bde-rose rounded-full"></span>
            Événements à venir
          </h2>
          {upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500">Aucun événement prévu pour le moment.</p>
            </div>
          )}
        </section>

        {/* Past */}
        <section className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <h2 className="text-2xl font-bold text-gray-400 mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-gray-300 rounded-full"></span>
            Historique
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
            {pastEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default CalendarPage;