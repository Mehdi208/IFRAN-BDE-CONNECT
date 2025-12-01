
import { db, storage } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Club, Event, Member, Mentor, Student, CinemaSale, ClubRegistration, DocumentRecord, EventRegistration } from '../types';

export const CINEMA_CLUB_ID = 'club-cinema-bde';

// --- MOCK DATA (Fallback) ---
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
    activities: ['Matchs inter-classes', 'Fitness hebdomadaire'],
    emoji: '⚽'
  },
  { 
    id: '2', 
    name: 'Club d\'Anglais', 
    description: 'Pratique de la langue anglaise, échanges culturels et débats.', 
    leaderName: 'Responsable Club', 
    leaderWhatsapp: '2250140152020',
    activities: ['Tea Time', 'Movie Night', 'Debate Club'],
    emoji: '🗣️' // Remplacement du drapeau
  },
  { 
    id: '3', 
    name: 'Club Art Oratoire & Débat', 
    description: 'Apprendre à convaincre, à structurer ses idées et à parler en public.', 
    leaderName: 'Responsable Club', 
    leaderWhatsapp: '2250140152020',
    activities: ['Concours d\'éloquence', 'Ateliers de prise de parole'],
    emoji: '🎤'
  },
  { 
    id: '4', 
    name: 'Club Jeux Vidéos', 
    description: 'Tournois E-sport, détente et culture gaming.', 
    leaderName: 'Responsable Club', 
    leaderWhatsapp: '2250140152020',
    activities: ['Tournoi FIFA', 'Soirées Gaming'],
    emoji: '🎮'
  },
  { 
    id: CINEMA_CLUB_ID, 
    name: 'Club Cinéma', 
    description: 'Découverte et discussion autour du 7ème art. Projections et analyses de films.', 
    leaderName: 'Responsable Club', 
    leaderWhatsapp: '2250140152020',
    activities: ['Projections hebdomadaires', 'Analyse filmique'],
    emoji: '🎬'
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
];

export const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Koné Bakary', level: 'B2 Dev', hasPaid: true, paymentDate: '2025-09-01', amount: 4000, paymentType: 'Mensuel' },
  { id: '2', name: 'Soro Minata', level: 'Prépa 1', hasPaid: false },
  { id: '3', name: 'Kouamé Cyrille', level: 'Master 1', hasPaid: true, paymentDate: '2025-09-10', amount: 4000, paymentType: 'Mensuel' },
  { id: '4', name: 'Zadi Prisca', level: 'B3 Com', hasPaid: true, paymentDate: '2025-09-05', amount: 10000, paymentType: 'Ponctuel' },
];

export const MOCK_MENTORS: Mentor[] = [
  { id: '1', name: 'Méhdi Traoré', subject: 'Communication Digitale', whatsapp: '2250789609672' },
  { id: '2', name: 'Koman Othniel', subject: 'Développement Web', whatsapp: '2250767842730' },
];

// --- HELPERS ---

const getFromStorage = <T,>(key: string, defaultData: T): T => {
  try {
    const stored = localStorage.getItem(key + '_v4'); // v4 for new schema
    if (stored) return JSON.parse(stored);
    localStorage.setItem(key + '_v4', JSON.stringify(defaultData));
    return defaultData;
  } catch (e) {
    return defaultData;
  }
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key + '_v4', JSON.stringify(data));
};

// Generic CRUD helper
const getAll = async <T>(collectionName: string, mockData: T[]): Promise<T[]> => {
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      if (snapshot.empty) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      console.warn(`Firestore: Error getting ${collectionName}, using local storage.`, error);
      return getFromStorage(collectionName, mockData);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getFromStorage(collectionName, mockData);
  }
};

const addOne = async <T>(collectionName: string, item: any, mockData: T[]): Promise<T[]> => {
    if (db) {
        await addDoc(collection(db, collectionName), item);
        return getAll(collectionName, mockData);
    } else {
        const current = getFromStorage(collectionName, mockData) as any[];
        const newItem = { ...item, id: Date.now().toString() };
        const updated = [...current, newItem];
        saveToStorage(collectionName, updated);
        return updated;
    }
}

const updateOne = async <T>(collectionName: string, item: any, mockData: T[]): Promise<T[]> => {
    if (db) {
        const { id, ...data } = item;
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, data);
        return getAll(collectionName, mockData);
    } else {
        const current = getFromStorage(collectionName, mockData) as any[];
        const updated = current.map(i => i.id === item.id ? item : i);
        saveToStorage(collectionName, updated);
        return updated;
    }
}

const deleteOne = async <T>(collectionName: string, id: string, mockData: T[]): Promise<T[]> => {
    if (db) {
        await deleteDoc(doc(db, collectionName, id));
        return getAll(collectionName, mockData);
    } else {
        const current = getFromStorage(collectionName, mockData) as any[];
        const updated = current.filter(i => i.id !== id);
        saveToStorage(collectionName, updated);
        return updated;
    }
}

// --- EXPORTED SERVICE ---

export const dataService = {
  // Image Upload
  uploadImage: async (file: File): Promise<string> => {
    if (!storage) {
        throw new Error("Firebase Storage n'est pas configuré.");
    }
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  },

  // Members
  fetchMembers: () => getAll<Member>('members', MOCK_MEMBERS),
  addMember: (member: Omit<Member, 'id'>) => addOne('members', member, MOCK_MEMBERS),
  updateMember: (member: Member) => updateOne('members', member, MOCK_MEMBERS),
  deleteMember: (id: string) => deleteOne('members', id, MOCK_MEMBERS),

  // Clubs
  fetchClubs: () => getAll<Club>('clubs', MOCK_CLUBS),
  addClub: (club: Omit<Club, 'id'>) => addOne('clubs', club, MOCK_CLUBS),
  updateClub: (club: Club) => updateOne('clubs', club, MOCK_CLUBS),
  deleteClub: (id: string) => deleteOne('clubs', id, MOCK_CLUBS),

  // Club Registrations
  registerToClub: async (registration: Omit<ClubRegistration, 'id'>) => {
    if (db) {
       await addDoc(collection(db, 'club_registrations'), registration);
    } else {
       const current = getFromStorage('club_registrations', []) as any[];
       const newItem = { ...registration, id: Date.now().toString() };
       saveToStorage('club_registrations', [...current, newItem]);
    }
  },
  
  fetchClubRegistrations: async (clubId?: string) => {
    if (db) {
        const ref = collection(db, 'club_registrations');
        const snapshot = await getDocs(ref);
        const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubRegistration));
        if (clubId) return all.filter(r => r.clubId === clubId);
        return all;
    } else {
        const all = getFromStorage<ClubRegistration[]>('club_registrations', []);
        if (clubId) return all.filter(r => r.clubId === clubId);
        return all;
    }
  },

  // Events
  fetchEvents: () => getAll<Event>('events', MOCK_EVENTS),
  addEvent: (event: Omit<Event, 'id'>) => addOne('events', event, MOCK_EVENTS),
  updateEvent: (event: Event) => updateOne('events', event, MOCK_EVENTS),
  deleteEvent: (id: string) => deleteOne('events', id, MOCK_EVENTS),
  
  // Event Registrations
  addEventRegistration: async (registration: Omit<EventRegistration, 'id'>) => {
    if (db) {
       await addDoc(collection(db, 'event_registrations'), registration);
       // Double inscription si c'est la soirée cinéma
       if (registration.eventId === 'soiree-cinema-dec12') {
         const clubRegistrationData = {
           clubId: CINEMA_CLUB_ID,
           studentName: registration.studentName,
           studentLevel: registration.studentLevel,
           studentWhatsapp: registration.studentWhatsapp,
           date: new Date().toISOString()
         };
         await addDoc(collection(db, 'club_registrations'), clubRegistrationData);
       }
    } else {
       // Mode LocalStorage
       const currentEventRegs = getFromStorage('event_registrations', []) as any[];
       const newEventReg = { ...registration, id: `evt-${Date.now()}` };
       saveToStorage('event_registrations', [...currentEventRegs, newEventReg]);

       if (registration.eventId === 'soiree-cinema-dec12') {
         const currentClubRegs = getFromStorage('club_registrations', []) as any[];
         const newClubReg = {
           clubId: CINEMA_CLUB_ID,
           studentName: registration.studentName,
           studentLevel: registration.studentLevel,
           studentWhatsapp: registration.studentWhatsapp,
           date: new Date().toISOString(),
           id: `club-${Date.now()}`
         };
         saveToStorage('club_registrations', [...currentClubRegs, newClubReg]);
       }
    }
  },
  fetchEventRegistrations: async (eventId: string) => {
    if (db) {
      const q = query(collection(db, 'event_registrations'), where("eventId", "==", eventId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRegistration));
    }
    return [];
  },

  // Students (Cotisations)
  fetchStudents: () => getAll<Student>('students', MOCK_STUDENTS),
  addStudent: (student: Omit<Student, 'id'>) => addOne('students', student, MOCK_STUDENTS),
  updateStudent: (student: Student) => updateOne('students', student, MOCK_STUDENTS),
  deleteStudent: (id: string) => deleteOne('students', id, MOCK_STUDENTS),

  // Cinema Sales
  fetchCinemaSales: () => getAll<CinemaSale>('cinema_sales', []),
  addCinemaSale: (sale: Omit<CinemaSale, 'id'>) => addOne('cinema_sales', sale, []),
  updateCinemaSale: (sale: CinemaSale) => updateOne('cinema_sales', sale, []),
  deleteCinemaSale: (id: string) => deleteOne('cinema_sales', id, []),
  
  // Document History
  fetchDocumentRecords: async () => {
    if (db) {
        const q = query(collection(db, 'documents'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentRecord));
    } else {
        return getFromStorage<DocumentRecord[]>('documents', []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  },
  addDocumentRecord: (record: Omit<DocumentRecord, 'id'>) => addOne('documents', record, []),

  // Mentors (Static)
  getMentors: () => MOCK_MENTORS,

  // Stats
  getStats: async () => {
    const students = await getAll('students', MOCK_STUDENTS);
    const clubs = await getAll('clubs', MOCK_CLUBS);
    const events = await getAll('events', MOCK_EVENTS);
    const paidCount = students.filter((s: any) => s.hasPaid).length;
    const totalCollected = students.filter((s: any) => s.hasPaid).reduce((acc, s: any) => acc + (s.amount || 0), 0);
    
    return {
      totalStudents: students.length,
      totalCollected: totalCollected,
      activeClubs: clubs.length,
      eventsCount: events.length
    };
  }
};
