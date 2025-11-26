import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Club, Event, Member, Mentor, Student } from '../types';

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

// Helper pour le mode Mock (LocalStorage)
const getFromStorage = <T,>(key: string, defaultData: T): T => {
  const stored = localStorage.getItem(key + '_v2');
  if (stored) return JSON.parse(stored);
  return defaultData;
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key + '_v2', JSON.stringify(data));
};

// --- DATA SERVICE ---

const isFirebaseReady = !!db;

export const dataService = {
  // --- STUDENTS ---
  getStudents: async (): Promise<Student[]> => {
    if (isFirebaseReady) {
        try {
            const querySnapshot = await getDocs(collection(db, "students"));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        } catch (e) { console.error(e); return getFromStorage('students', MOCK_STUDENTS); }
    }
    return new Promise(resolve => resolve(getFromStorage('students', MOCK_STUDENTS)));
  },
  saveStudents: async (students: Student[]) => {
    if (isFirebaseReady) {
        // En mode réel, on devrait sauvegarder un par un ou utiliser un batch, 
        // mais ici on simule l'interface existante.
        // Pour simplifier l'hybridation, on met juste à jour localStorage pour l'instant
        // ou on implémente la logique d'ajout/modif unitaire dans les composants.
    }
    saveToStorage('students', students);
  },
  // Nouvelles méthodes atomiques pour Firebase
  addStudent: async (student: Omit<Student, 'id'>) => {
    if (isFirebaseReady) {
        await addDoc(collection(db, "students"), student);
    } else {
        const current = getFromStorage('students', MOCK_STUDENTS);
        saveToStorage('students', [...current, { ...student, id: Date.now().toString() }]);
    }
  },
  updateStudent: async (student: Student) => {
    if (isFirebaseReady) {
        await updateDoc(doc(db, "students", student.id), { ...student });
    } else {
        const current = getFromStorage('students', MOCK_STUDENTS);
        saveToStorage('students', current.map((s: Student) => s.id === student.id ? student : s));
    }
  },
  deleteStudent: async (id: string) => {
    if (isFirebaseReady) {
        await deleteDoc(doc(db, "students", id));
    } else {
        const current = getFromStorage('students', MOCK_STUDENTS);
        saveToStorage('students', current.filter((s: Student) => s.id !== id));
    }
  },

  // --- EVENTS ---
  getEvents: async (): Promise<Event[]> => {
    if (isFirebaseReady) {
        try {
            const qs = await getDocs(collection(db, "events"));
            return qs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
        } catch(e) { return getFromStorage('events', MOCK_EVENTS); }
    }
    return new Promise(resolve => resolve(getFromStorage('events', MOCK_EVENTS)));
  },
  saveEvents: async (events: Event[]) => saveToStorage('events', events), // Deprecated for atomics
  addEvent: async (event: Omit<Event, 'id'>) => {
      if(isFirebaseReady) await addDoc(collection(db, "events"), event);
      else {
          const current = getFromStorage('events', MOCK_EVENTS);
          saveToStorage('events', [...current, { ...event, id: Date.now().toString() }]);
      }
  },
  updateEvent: async (event: Event) => {
      if(isFirebaseReady) await updateDoc(doc(db, "events", event.id), { ...event });
      else {
          const current = getFromStorage('events', MOCK_EVENTS);
          saveToStorage('events', current.map((e: Event) => e.id === event.id ? event : e));
      }
  },
  deleteEvent: async (id: string) => {
      if(isFirebaseReady) await deleteDoc(doc(db, "events", id));
      else {
          const current = getFromStorage('events', MOCK_EVENTS);
          saveToStorage('events', current.filter((e: Event) => e.id !== id));
      }
  },

  // --- CLUBS ---
  getClubs: async (): Promise<Club[]> => {
    if (isFirebaseReady) {
        try {
            const qs = await getDocs(collection(db, "clubs"));
            return qs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
        } catch(e) { return getFromStorage('clubs', MOCK_CLUBS); }
    }
    return new Promise(resolve => resolve(getFromStorage('clubs', MOCK_CLUBS)));
  },
  saveClubs: async (clubs: Club[]) => saveToStorage('clubs', clubs),
  
  // --- MEMBERS ---
  getMembers: async (): Promise<Member[]> => {
    if (isFirebaseReady) {
        try {
            const qs = await getDocs(collection(db, "members"));
            return qs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        } catch(e) { return getFromStorage('members', MOCK_MEMBERS); }
    }
    return new Promise(resolve => resolve(getFromStorage('members', MOCK_MEMBERS)));
  },
  saveMembers: async (members: Member[]) => saveToStorage('members', members),

  getMentors: () => MOCK_MENTORS,

  // Fonction utilitaire pour peupler la BDD Firebase la première fois
  seedDatabase: async () => {
    if (!isFirebaseReady) return alert("Firebase non configuré !");
    
    // Seed Events
    for (const e of MOCK_EVENTS) { await addDoc(collection(db, "events"), e); }
    // Seed Clubs
    for (const c of MOCK_CLUBS) { await addDoc(collection(db, "clubs"), c); }
    // Seed Students
    for (const s of MOCK_STUDENTS) { await addDoc(collection(db, "students"), s); }
    // Seed Members
    for (const m of MOCK_MEMBERS) { await addDoc(collection(db, "members"), m); }
    
    alert("Base de données initialisée avec les données de test !");
  }
};