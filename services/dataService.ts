
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, writeBatch, getDoc } from 'firebase/firestore';
import { Club, Atelier, Event, Member, Mentor, Student, CinemaSale, ClubRegistration, DocumentRecord } from '../types';

export const CINEMA_CLUB_ID = 'atelier-cinema-default';

const sanitizeData = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
};

const isAuth = () => !!auth?.currentUser;
const isLocalAdmin = () => localStorage.getItem('isAuthenticated') === 'true' && !isAuth();

const STORAGE_KEY_SUFFIX = '_v11'; 

const getFromStorage = <T,>(key: string, defaultData: T): T => {
  try {
    const stored = localStorage.getItem(key + STORAGE_KEY_SUFFIX);
    if (stored) return JSON.parse(stored);
    return defaultData;
  } catch (e) {
    return defaultData;
  }
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key + STORAGE_KEY_SUFFIX, JSON.stringify(data));
};

const getAll = async <T>(collectionName: string, mockData: T[]): Promise<T[]> => {
  if (isLocalAdmin()) return getFromStorage(collectionName, mockData);

  if (db) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      if (snapshot.empty) return getFromStorage(collectionName, mockData);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      return getFromStorage(collectionName, mockData);
    }
  }
  return getFromStorage(collectionName, mockData);
};

export const dataService = {
  uploadImage: (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.readAsDataURL(file);
    });
  },

  fetchMembers: async () => {
    const data = await getAll<Member>('members', []);
    return data.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
  },
  addMember: async (member: Omit<Member, 'id'>) => {
    const data = sanitizeData(member);
    if (db && isAuth() && !isLocalAdmin()) await addDoc(collection(db, 'members'), data);
    else { const curr = getFromStorage<Member[]>('members', []); saveToStorage('members', [...curr, { ...data, id: Date.now().toString() }]); }
    return dataService.fetchMembers();
  },
  updateMember: async (m: Member) => {
    const { id, ...data } = sanitizeData(m);
    if (db && isAuth() && !isLocalAdmin()) await updateDoc(doc(db, 'members', id), data);
    else { const curr = getFromStorage<Member[]>('members', []); saveToStorage('members', curr.map(x => x.id === id ? { ...data, id } : x)); }
    return dataService.fetchMembers();
  },
  deleteMember: async (id: string) => {
    if (db && isAuth() && !isLocalAdmin()) await deleteDoc(doc(db, 'members', id));
    else { const curr = getFromStorage<Member[]>('members', []); saveToStorage('members', curr.filter(x => x.id !== id)); }
    return dataService.fetchMembers();
  },
  updateMembersOrder: async (members: Member[]) => {
    if (db && isAuth() && !isLocalAdmin()) { const b = writeBatch(db); members.forEach((m, i) => b.update(doc(db, 'members', m.id), { orderIndex: i })); await b.commit(); }
    else saveToStorage('members', members.map((m, i) => ({ ...m, orderIndex: i })));
  },

  fetchClubs: () => getAll<Club>('clubs', []),
  addClub: async (club: Omit<Club, 'id'>) => {
    const data = sanitizeData(club);
    if (db && isAuth() && !isLocalAdmin()) await addDoc(collection(db, 'clubs'), data);
    else { const curr = getFromStorage<Club[]>('clubs', []); saveToStorage('clubs', [...curr, { ...data, id: Date.now().toString() }]); }
    return dataService.fetchClubs();
  },
  updateClub: async (c: Club) => {
    const { id, ...data } = sanitizeData(c);
    if (db && isAuth() && !isLocalAdmin()) await updateDoc(doc(db, 'clubs', id), data);
    else { const curr = getFromStorage<Club[]>('clubs', []); saveToStorage('clubs', curr.map(x => x.id === id ? { ...data, id } : x)); }
    return dataService.fetchClubs();
  },
  deleteClub: async (id: string) => {
    if (db && isAuth() && !isLocalAdmin()) {
        await deleteDoc(doc(db, 'clubs', id));
        const regs = await getDocs(query(collection(db, 'club_registrations'), where('clubId', '==', id)));
        const batch = writeBatch(db);
        regs.forEach(r => batch.delete(r.ref));
        await batch.commit();
    } else { 
        const curr = getFromStorage<Club[]>('clubs', []); 
        saveToStorage('clubs', curr.filter(x => x.id !== id));
        const regs = getFromStorage<ClubRegistration[]>('club_registrations', []);
        saveToStorage('club_registrations', regs.filter(r => r.clubId !== id));
    }
    return dataService.fetchClubs();
  },

  fetchAteliers: async () => {
    const data = await getAll<Atelier>('ateliers', []);
    return data.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
  },
  addAtelier: async (a: Omit<Atelier, 'id'>) => {
    const data = sanitizeData(a);
    if (db && isAuth() && !isLocalAdmin()) await addDoc(collection(db, 'ateliers'), data);
    else { const curr = getFromStorage<Atelier[]>('ateliers', []); saveToStorage('ateliers', [...curr, { ...data, id: Date.now().toString() }]); }
    return dataService.fetchAteliers();
  },
  updateAtelier: async (a: Atelier) => {
    const { id, ...data } = sanitizeData(a);
    if (db && isAuth() && !isLocalAdmin()) await updateDoc(doc(db, 'ateliers', id), data);
    else { const curr = getFromStorage<Atelier[]>('ateliers', []); saveToStorage('ateliers', curr.map(x => x.id === id ? { ...data, id } : x)); }
    return dataService.fetchAteliers();
  },
  deleteAtelier: async (id: string) => {
    if (db && isAuth() && !isLocalAdmin()) {
        await deleteDoc(doc(db, 'ateliers', id));
        const regs = await getDocs(query(collection(db, 'club_registrations'), where('atelierId', '==', id)));
        const batch = writeBatch(db);
        regs.forEach(r => batch.delete(r.ref));
        await batch.commit();
    } else { 
        const curr = getFromStorage<Atelier[]>('ateliers', []); 
        saveToStorage('ateliers', curr.filter(x => x.id !== id));
        const regs = getFromStorage<ClubRegistration[]>('club_registrations', []);
        saveToStorage('club_registrations', regs.filter(r => r.atelierId !== id));
    }
    return dataService.fetchAteliers();
  },
  updateAteliersOrder: async (ateliers: Atelier[]) => {
    if (db && isAuth() && !isLocalAdmin()) { const b = writeBatch(db); ateliers.forEach((a, i) => b.update(doc(db, 'ateliers', a.id), { orderIndex: i })); await b.commit(); }
    else saveToStorage('ateliers', ateliers.map((a, i) => ({ ...a, orderIndex: i })));
  },

  registerToClub: async (registration: Omit<ClubRegistration, 'id'>) => {
    const data = sanitizeData(registration);
    if (db && !isLocalAdmin()) {
        try { await addDoc(collection(db, 'club_registrations'), data); }
        catch (e) { const curr = getFromStorage('club_registrations', []); saveToStorage('club_registrations', [...curr, { ...data, id: Date.now().toString() }]); }
    } else { const curr = getFromStorage('club_registrations', []); saveToStorage('club_registrations', [...curr, { ...data, id: Date.now().toString() }]); }
  },
  updateClubRegistration: async (reg: ClubRegistration) => {
    const { id, ...data } = sanitizeData(reg);
    if (db && isAuth() && !isLocalAdmin()) await updateDoc(doc(db, 'club_registrations', id), data);
    else { const curr = getFromStorage<ClubRegistration[]>('club_registrations', []); saveToStorage('club_registrations', curr.map(x => x.id === id ? { ...data, id } : x)); }
  },
  fetchClubRegistrations: async (filterId?: string, isAtelier: boolean = false) => {
    const all = await getAll<ClubRegistration>('club_registrations', []);
    
    if (!filterId) {
        return all.filter(r => {
            if (r.isAtelier) return !!r.atelierId;
            return !!r.clubId;
        });
    }

    return all.filter(r => {
        if (isAtelier) {
            return r.isAtelier === true && r.atelierId === filterId;
        } else {
            return r.isAtelier !== true && r.clubId === filterId;
        }
    });
  },
  deleteClubRegistration: async (id: string) => {
    if (db && isAuth() && !isLocalAdmin()) await deleteDoc(doc(db, 'club_registrations', id));
    else { const curr = getFromStorage<ClubRegistration[]>('club_registrations', []); saveToStorage('club_registrations', curr.filter(x => x.id !== id)); }
  },
  resetAtelierRegistrations: async (atelierId: string) => {
    if (db && isAuth() && !isLocalAdmin()) {
        const q = query(collection(db, 'club_registrations'), where('atelierId', '==', atelierId), where('isAtelier', '==', true));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(d => batch.delete(d.ref));
        await batch.commit();
    } else {
        const curr = getFromStorage<ClubRegistration[]>('club_registrations', []);
        saveToStorage('club_registrations', curr.filter(r => !(r.atelierId === atelierId && r.isAtelier === true)));
    }
  },
  wipeAllAteliersRegistrations: async () => {
    if (db && isAuth() && !isLocalAdmin()) {
        const q = query(collection(db, 'club_registrations'), where('isAtelier', '==', true));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(d => batch.delete(d.ref));
        await batch.commit();
    } else {
        const curr = getFromStorage<ClubRegistration[]>('club_registrations', []);
        saveToStorage('club_registrations', curr.filter(r => r.isAtelier !== true));
    }
  },

  fetchEvents: () => getAll<Event>('events', []),
  addEvent: async (e: Omit<Event, 'id'>) => {
    const data = sanitizeData(e);
    if (db && isAuth() && !isLocalAdmin()) await addDoc(collection(db, 'events'), data);
    else { const curr = getFromStorage<Event[]>('events', []); saveToStorage('events', [...curr, { ...data, id: Date.now().toString() }]); }
    return dataService.fetchEvents();
  },
  updateEvent: async (e: Event) => {
    const { id, ...data } = sanitizeData(e);
    if (db && isAuth() && !isLocalAdmin()) await updateDoc(doc(db, 'events', id), data);
    else { const curr = getFromStorage<Event[]>('events', []); saveToStorage('events', curr.map(x => x.id === id ? { ...data, id } : x)); }
    return dataService.fetchEvents();
  },
  deleteEvent: async (id: string) => {
    if (db && isAuth() && !isLocalAdmin()) await deleteDoc(doc(db, 'events', id));
    else { const curr = getFromStorage<Event[]>('events', []); saveToStorage('events', curr.filter(x => x.id !== id)); }
    return dataService.fetchEvents();
  },

  fetchMentors: async () => {
    const data = await getAll<Mentor>('mentors', []);
    return data.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
  },
  addMentor: async (m: Omit<Mentor, 'id'>) => {
    const data = sanitizeData(m);
    if (db && isAuth() && !isLocalAdmin()) await addDoc(collection(db, 'mentors'), data);
    else { const curr = getFromStorage<Mentor[]>('mentors', []); saveToStorage('mentors', [...curr, { ...data, id: Date.now().toString() }]); }
    return dataService.fetchMentors();
  },
  updateMentor: async (m: Mentor) => {
    const { id, ...data } = sanitizeData(m);
    if (db && isAuth() && !isLocalAdmin()) await updateDoc(doc(db, 'mentors', id), data);
    else { const curr = getFromStorage<Mentor[]>('mentors', []); saveToStorage('mentors', curr.map(x => x.id === id ? { ...data, id } : x)); }
    return dataService.fetchMentors();
  },
  deleteMentor: async (id: string) => {
    if (db && isAuth() && !isLocalAdmin()) await deleteDoc(doc(db, 'mentors', id));
    else { const curr = getFromStorage<Mentor[]>('mentors', []); saveToStorage('mentors', curr.filter(x => x.id !== id)); }
    return dataService.fetchMentors();
  },
  updateMentorsOrder: async (mentors: Mentor[]) => {
    if (db && isAuth() && !isLocalAdmin()) { const b = writeBatch(db); mentors.forEach((m, i) => b.update(doc(db, 'mentors', m.id), { orderIndex: i })); await b.commit(); }
    else saveToStorage('mentors', mentors.map((m, i) => ({ ...m, orderIndex: i })));
  },

  fetchDocumentRecords: () => getAll<DocumentRecord>('documents', []),
  addDocumentRecord: async (r: Omit<DocumentRecord, 'id'>) => {
    const data = sanitizeData(r);
    if (db && isAuth() && !isLocalAdmin()) await addDoc(collection(db, 'documents'), data);
    else { const curr = getFromStorage<DocumentRecord[]>('documents', []); saveToStorage('documents', [...curr, { ...data, id: Date.now().toString() }]); }
  },

  fetchStudents: () => getAll<Student>('students', []),
  addStudent: async (s: Omit<Student, 'id'>) => {
    const data = sanitizeData(s);
    if (db && isAuth() && !isLocalAdmin()) await addDoc(collection(db, 'students'), data);
    else { const curr = getFromStorage<Student[]>('students', []); saveToStorage('students', [...curr, { ...data, id: Date.now().toString() }]); }
    return dataService.fetchStudents();
  },
  updateStudent: async (s: Student) => {
    const { id, ...data } = sanitizeData(s);
    if (db && isAuth() && !isLocalAdmin()) await updateDoc(doc(db, 'students', id), data);
    else { const curr = getFromStorage<Student[]>('students', []); saveToStorage('students', curr.map(x => x.id === id ? { ...data, id } : x)); }
    return dataService.fetchStudents();
  },
  deleteStudent: async (id: string) => {
    if (db && isAuth() && !isLocalAdmin()) await deleteDoc(doc(db, 'students', id));
    else { const curr = getFromStorage<Student[]>('students', []); saveToStorage('students', curr.filter(x => x.id !== id)); }
    return dataService.fetchStudents();
  },

  fetchCinemaSales: () => getAll<CinemaSale>('cinema_sales', []),
  addCinemaSale: async (s: Omit<CinemaSale, 'id'>) => {
    const data = sanitizeData(s);
    if (db && isAuth() && !isLocalAdmin()) await addDoc(collection(db, 'cinema_sales'), data);
    else { const curr = getFromStorage<CinemaSale[]>('cinema_sales', []); saveToStorage('cinema_sales', [...curr, { ...data, id: Date.now().toString() }]); }
    return dataService.fetchCinemaSales();
  },
  updateCinemaSale: async (s: CinemaSale) => {
    const { id, ...data } = sanitizeData(s);
    if (db && isAuth() && !isLocalAdmin()) await updateDoc(doc(db, 'cinema_sales', id), data);
    else { const curr = getFromStorage<CinemaSale[]>('cinema_sales', []); saveToStorage('cinema_sales', curr.map(x => x.id === id ? { ...data, id } : x)); }
    return dataService.fetchCinemaSales();
  },
  deleteCinemaSale: async (id: string) => {
    if (db && isAuth() && !isLocalAdmin()) await deleteDoc(doc(db, 'cinema_sales', id));
    else { const curr = getFromStorage<CinemaSale[]>('cinema_sales', []); saveToStorage('cinema_sales', curr.filter(x => x.id !== id)); }
    return dataService.fetchCinemaSales();
  }
};
