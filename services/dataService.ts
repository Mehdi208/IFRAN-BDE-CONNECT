import { Club, Event, Member, Mentor, Student } from '../types';

// Mock Data
export const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Méhdi Traoré', role: 'Président', photoUrl: 'https://ui-avatars.com/api/?name=Mehdi+Traore&background=0F1E3A&color=fff', whatsapp: '2250789609672' },
  { id: '2', name: 'Poste Vacant', role: 'Vice-président', photoUrl: 'https://ui-avatars.com/api/?name=VP&background=eee&color=999', whatsapp: '225' },
  { id: '3', name: 'Ouattara Wendy', role: 'Secrétaire Générale', photoUrl: 'https://ui-avatars.com/api/?name=Ouattara+Wendy&background=E74A67&color=fff', whatsapp: '2250769275305' },
  { id: '4', name: 'Kouadio Eden', role: 'Trésorière', photoUrl: 'https://ui-avatars.com/api/?name=Kouadio+Eden&background=0F1E3A&color=fff', whatsapp: '2250104210117' },
  { id: '5', name: 'Kadiatou Diallo', role: 'Resp. Com & Médias', photoUrl: 'https://ui-avatars.com/api/?name=Kadiatou+Diallo&background=E74A67&color=fff', whatsapp: '2250779534720' },
  { id: '6', name: 'Bazzé Aurélia', role: 'Resp. Événementiel', photoUrl: 'https://ui-avatars.com/api/?name=Bazze+Aurelia&background=0F1E3A&color=fff', whatsapp: '2250566868795' },
  { id: '7', name: 'Nasser Darine', role: 'Resp. Affaires Sociales', photoUrl: 'https://ui-avatars.com/api/?name=Nasser+Darine&background=E74A67&color=fff', whatsapp: '2250574406161' },
  { id: '8', name: 'Koffi Jean Philippe', role: 'Resp. Logistique', photoUrl: 'https://ui-avatars.com/api/?name=Koffi+Jean&background=0F1E3A&color=fff', whatsapp: '2250708878659' },
  { id: '9', name: 'EL HAGE Mohamed', role: 'Représentant Prépa 1', photoUrl: 'https://ui-avatars.com/api/?name=El+Hage&background=E74A67&color=fff', whatsapp: '2250101013102' },
  { id: '10', name: 'Joas Phamuel', role: 'Représentant Prépa 1', photoUrl: 'https://ui-avatars.com/api/?name=Joas+Phamuel&background=0F1E3A&color=fff', whatsapp: '14388692832' },
  { id: '11', name: 'Kouassi Jemima', role: 'Resp. Clubs Étudiants', photoUrl: 'https://ui-avatars.com/api/?name=Kouassi+Jemima&background=E74A67&color=fff', whatsapp: '2250140152020' },
  { id: '12', name: 'Abraham Vandoli', role: 'Représentant B2', photoUrl: 'https://ui-avatars.com/api/?name=Abraham+Vandoli&background=0F1E3A&color=fff', whatsapp: '2250787381250' },
];

export const MOCK_CLUBS: Club[] = [
  { 
    id: '1', 
    name: 'Club Sportif', 
    description: 'Football, Basketball et remise en forme pour tous les étudiants.', 
    leaderName: 'Kouassi Jemima', 
    leaderWhatsapp: '2250140152020',
    activities: ['Matchs inter-classes', 'Fitness hebdomadaire']
  },
  { 
    id: '2', 
    name: 'Club d\'Anglais', 
    description: 'Pratique de la langue anglaise, échanges culturels et débats.', 
    leaderName: 'Responsable Club', 
    leaderWhatsapp: '2250140152020',
    activities: ['Tea Time', 'Movie Night', 'Debate Club']
  },
  { 
    id: '3', 
    name: 'Club Art Oratoire & Débat', 
    description: 'Apprendre à convaincre, à structurer ses idées et à parler en public.', 
    leaderName: 'Responsable Club', 
    leaderWhatsapp: '2250140152020',
    activities: ['Concours d\'éloquence', 'Ateliers de prise de parole']
  },
  { 
    id: '4', 
    name: 'Club Jeux Vidéos', 
    description: 'Tournois E-sport, détente et culture gaming.', 
    leaderName: 'Responsable Club', 
    leaderWhatsapp: '2250140152020',
    activities: ['Tournoi FIFA', 'Soirées Gaming']
  },
];

export const MOCK_EVENTS: Event[] = [
  { 
    id: '1', 
    title: 'Journée d\'Intégration', 
    date: '2025-10-15', 
    location: 'Campus IFRAN', 
    description: 'Accueil des nouveaux étudiants avec jeux et barbecue.', 
    imageUrl: 'https://picsum.photos/800/400?random=10', 
    status: 'upcoming' 
  },
  { 
    id: '2', 
    title: 'Conférence Tech & IA', 
    date: '2025-11-05', 
    location: 'Amphithéâtre A', 
    description: 'L\'IA en Afrique : Opportunités et défis.', 
    imageUrl: 'https://picsum.photos/800/400?random=11', 
    status: 'upcoming' 
  },
  { 
    id: '3', 
    title: 'Tournoi de Football', 
    date: '2025-09-20', 
    location: 'Stade Municipal', 
    description: 'Inter-filières : Qui remportera la coupe ?', 
    imageUrl: 'https://picsum.photos/800/400?random=12', 
    status: 'past' 
  },
];

export const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Koné Bakary', level: 'B2 Dev', hasPaid: true, paymentDate: '2025-09-01', amount: 15000 },
  { id: '2', name: 'Soro Minata', level: 'Prépa 1', hasPaid: false },
  { id: '3', name: 'Kouamé Cyrille', level: 'Master 1', hasPaid: true, paymentDate: '2025-09-10', amount: 15000 },
  { id: '4', name: 'Zadi Prisca', level: 'B3 Com', hasPaid: true, paymentDate: '2025-09-05', amount: 15000 },
];

export const MOCK_MENTORS: Mentor[] = [
  { id: '1', name: 'Méhdi Traoré', subject: 'Communication Digitale', whatsapp: '2250789609672' },
  { id: '2', name: 'Koman Othniel', subject: 'Développement Web', whatsapp: '2250767842730' },
];

// Local Storage Helpers to simulate persistence
const getFromStorage = <T,>(key: string, defaultData: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  return defaultData;
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dataService = {
  getMembers: () => getFromStorage('members', MOCK_MEMBERS),
  saveMembers: (members: Member[]) => saveToStorage('members', members),

  getClubs: () => getFromStorage('clubs', MOCK_CLUBS),
  saveClubs: (clubs: Club[]) => saveToStorage('clubs', clubs),

  getEvents: () => getFromStorage('events', MOCK_EVENTS),
  saveEvents: (events: Event[]) => saveToStorage('events', events),

  getStudents: () => getFromStorage('students', MOCK_STUDENTS),
  saveStudents: (students: Student[]) => saveToStorage('students', students),
  
  getMentors: () => MOCK_MENTORS,

  getStats: () => {
    const students = getFromStorage('students', MOCK_STUDENTS);
    const clubs = getFromStorage('clubs', MOCK_CLUBS);
    const events = getFromStorage('events', MOCK_EVENTS);
    const paidCount = students.filter((s: Student) => s.hasPaid).length;
    
    return {
      totalStudents: students.length,
      totalCollected: paidCount * 15000,
      activeClubs: clubs.length,
      eventsCount: events.length
    };
  }
};