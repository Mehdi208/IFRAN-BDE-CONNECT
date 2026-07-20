
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, writeBatch, getDoc } from 'firebase/firestore';
import { Club, Atelier, Event, Member, Mentor, Student, CinemaSale, ClubRegistration, DocumentRecord, Product, FoodOrder, GalleryItem, AssinieRegistration, NazaRegistration, ProspectContact, CampaignTemplate } from '../types';

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

// On garde ces fonctions pour le fallback uniquement si Firebase est HS
const STORAGE_KEY_SUFFIX = '_v12'; 
const getFromStorage = <T,>(key: string, defaultData: T): T => {
  try {
    const stored = localStorage.getItem(key + STORAGE_KEY_SUFFIX);
    if (stored) return JSON.parse(stored);
    return defaultData;
  } catch (e) { return defaultData; }
};
const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key + STORAGE_KEY_SUFFIX, JSON.stringify(data));
};

const getAll = async <T>(collectionName: string, mockData: T[]): Promise<T[]> => {
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      }
    } catch (error) {
      console.warn(`Firestore read error on ${collectionName}, falling back to local:`, error);
    }
  }
  return getFromStorage(collectionName, mockData);
};

export const dataService = {
  uploadImage: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
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
        img.onerror = () => {
          reject(new Error("Le fichier n'est pas une image valide ou est corrompu."));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier."));
      reader.readAsDataURL(file);
    });
  },

  // --- CANTINE : PRODUITS ---
  fetchProducts: () => getAll<Product>('products', []),
  addProduct: async (p: Omit<Product, 'id'>) => {
    const data = sanitizeData(p);
    if (db) {
      const res = await addDoc(collection(db, 'products'), data);
      return dataService.fetchProducts();
    }
    const curr = getFromStorage<Product[]>('products', []);
    saveToStorage('products', [...curr, { ...data, id: Date.now().toString() }]);
    return dataService.fetchProducts();
  },
  updateProduct: async (p: Product) => {
    const { id, ...data } = sanitizeData(p);
    if (db) {
      await updateDoc(doc(db, 'products', id), data);
      return dataService.fetchProducts();
    }
    const curr = getFromStorage<Product[]>('products', []);
    saveToStorage('products', curr.map(x => x.id === id ? { ...data, id } : x));
    return dataService.fetchProducts();
  },
  deleteProduct: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'products', id));
    else {
      const curr = getFromStorage<Product[]>('products', []);
      saveToStorage('products', curr.filter(x => x.id !== id));
    }
    return dataService.fetchProducts();
  },

  // --- CANTINE : COMMANDES ---
  fetchFoodOrders: () => getAll<FoodOrder>('food_orders', []),
  addFoodOrder: async (o: Omit<FoodOrder, 'id'>) => {
    const data = sanitizeData(o);
    if (db) await addDoc(collection(db, 'food_orders'), data);
    else {
      const curr = getFromStorage<FoodOrder[]>('food_orders', []);
      saveToStorage('food_orders', [...curr, { ...data, id: Date.now().toString() }]);
    }
    return dataService.fetchFoodOrders();
  },
  updateFoodOrder: async (o: FoodOrder) => {
    const { id, ...data } = sanitizeData(o);
    if (db) await updateDoc(doc(db, 'food_orders', id), data);
    else {
      const curr = getFromStorage<FoodOrder[]>('food_orders', []);
      saveToStorage('food_orders', curr.map(x => x.id === id ? { ...data, id } : x));
    }
    return dataService.fetchFoodOrders();
  },

  fetchMembers: async () => {
    const data = await getAll<Member>('members', []);
    return data.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
  },
  addMember: async (member: Omit<Member, 'id'>) => {
    const data = sanitizeData(member);
    if (db) await addDoc(collection(db, 'members'), data);
    return dataService.fetchMembers();
  },
  updateMember: async (m: Member) => {
    const { id, ...data } = sanitizeData(m);
    if (db) await updateDoc(doc(db, 'members', id), data);
    return dataService.fetchMembers();
  },
  deleteMember: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'members', id));
    return dataService.fetchMembers();
  },
  updateMembersOrder: async (members: Member[]) => {
    if (db) {
      const b = writeBatch(db);
      members.forEach((m, i) => b.update(doc(db, 'members', m.id), { orderIndex: i }));
      await b.commit();
    }
  },

  fetchClubs: () => getAll<Club>('clubs', []),
  addClub: async (club: Omit<Club, 'id'>) => {
    const data = sanitizeData(club);
    if (db) await addDoc(collection(db, 'clubs'), data);
    return dataService.fetchClubs();
  },
  updateClub: async (c: Club) => {
    const { id, ...data } = sanitizeData(c);
    if (db) await updateDoc(doc(db, 'clubs', id), data);
    return dataService.fetchClubs();
  },
  deleteClub: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'clubs', id));
    return dataService.fetchClubs();
  },

  fetchAteliers: async () => {
    const data = await getAll<Atelier>('ateliers', []);
    return data.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
  },
  addAtelier: async (a: Omit<Atelier, 'id'>) => {
    const data = sanitizeData(a);
    if (db) await addDoc(collection(db, 'ateliers'), data);
    return dataService.fetchAteliers();
  },
  updateAtelier: async (a: Atelier) => {
    const { id, ...data } = sanitizeData(a);
    if (db) await updateDoc(doc(db, 'ateliers', id), data);
    return dataService.fetchAteliers();
  },
  deleteAtelier: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'ateliers', id));
    return dataService.fetchAteliers();
  },
  updateAteliersOrder: async (ateliers: Atelier[]) => {
    if (db) {
      const b = writeBatch(db);
      ateliers.forEach((a, i) => b.update(doc(db, 'ateliers', a.id), { orderIndex: i }));
      await b.commit();
    }
  },

  registerToClub: async (registration: Omit<ClubRegistration, 'id'>) => {
    const data = sanitizeData(registration);
    if (db) await addDoc(collection(db, 'club_registrations'), data);
  },
  updateClubRegistration: async (reg: ClubRegistration) => {
    const { id, ...data } = sanitizeData(reg);
    if (db) await updateDoc(doc(db, 'club_registrations', id), data);
  },
  fetchClubRegistrations: async (filterId?: string, isAtelier: boolean = false) => {
    const all = await getAll<ClubRegistration>('club_registrations', []);
    if (!filterId) return all;
    return all.filter(r => isAtelier ? r.atelierId === filterId : r.clubId === filterId);
  },
  deleteClubRegistration: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'club_registrations', id));
  },
  resetAtelierRegistrations: async (atelierId: string) => {
    if (db) {
        const q = query(collection(db, 'club_registrations'), where('atelierId', '==', atelierId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
  },
  wipeAllAteliersRegistrations: async () => {
    if (db) {
        const q = query(collection(db, 'club_registrations'), where('isAtelier', '==', true));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
  },

  fetchEvents: () => getAll<Event>('events', []),
  addEvent: async (e: Omit<Event, 'id'>) => {
    const data = sanitizeData(e);
    if (db) await addDoc(collection(db, 'events'), data);
    return dataService.fetchEvents();
  },
  updateEvent: async (e: Event) => {
    const { id, ...data } = sanitizeData(e);
    if (db) await updateDoc(doc(db, 'events', id), data);
    return dataService.fetchEvents();
  },
  deleteEvent: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'events', id));
    return dataService.fetchEvents();
  },

  fetchMentors: async () => {
    const data = await getAll<Mentor>('mentors', []);
    return data.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
  },
  addMentor: async (m: Omit<Mentor, 'id'>) => {
    const data = sanitizeData(m);
    if (db) await addDoc(collection(db, 'mentors'), data);
    return dataService.fetchMentors();
  },
  updateMentor: async (m: Mentor) => {
    const { id, ...data } = sanitizeData(m);
    if (db) await updateDoc(doc(db, 'mentors', id), data);
    return dataService.fetchMentors();
  },
  deleteMentor: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'mentors', id));
    return dataService.fetchMentors();
  },
  updateMentorsOrder: async (mentors: Mentor[]) => {
    if (db) {
      const b = writeBatch(db);
      mentors.forEach((m, i) => b.update(doc(db, 'mentors', m.id), { orderIndex: i }));
      await b.commit();
    }
  },

  fetchDocumentRecords: () => getAll<DocumentRecord>('documents', []),
  addDocumentRecord: async (r: Omit<DocumentRecord, 'id'>) => {
    const data = sanitizeData(r);
    if (db) await addDoc(collection(db, 'documents'), data);
  },

  fetchStudents: () => getAll<Student>('students', []),
  addStudent: async (s: Omit<Student, 'id'>) => {
    const data = sanitizeData(s);
    if (db) await addDoc(collection(db, 'students'), data);
    return dataService.fetchStudents();
  },
  updateStudent: async (s: Student) => {
    const { id, ...data } = sanitizeData(s);
    if (db) await updateDoc(doc(db, 'students', id), data);
    return dataService.fetchStudents();
  },
  deleteStudent: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'students', id));
    return dataService.fetchStudents();
  },

  fetchCinemaSales: () => getAll<CinemaSale>('cinema_sales', []),
  addCinemaSale: async (s: Omit<CinemaSale, 'id'>) => {
    const data = sanitizeData(s);
    if (db) await addDoc(collection(db, 'cinema_sales'), data);
    return dataService.fetchCinemaSales();
  },
  updateCinemaSale: async (s: CinemaSale) => {
    const { id, ...data } = sanitizeData(s);
    if (db) await updateDoc(doc(db, 'cinema_sales', id), data);
    return dataService.fetchCinemaSales();
  },
  deleteCinemaSale: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'cinema_sales', id));
    return dataService.fetchCinemaSales();
  },

  fetchGalleryItems: () => getAll<GalleryItem>('gallery', []),
  addGalleryItem: async (item: Omit<GalleryItem, 'id'>) => {
    const data = sanitizeData(item);
    if (db) await addDoc(collection(db, 'gallery'), data);
    else {
      const curr = getFromStorage<GalleryItem[]>('gallery', []);
      saveToStorage('gallery', [...curr, { ...data, id: Date.now().toString() }]);
    }
    return dataService.fetchGalleryItems();
  },
  addGalleryItems: async (items: Omit<GalleryItem, 'id'>[]) => {
    if (db) {
      // On utilise des lots (batches) pour éviter de surcharger Firebase
      const chunkSize = 50;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(item => {
          const docRef = doc(collection(db, 'gallery'));
          batch.set(docRef, sanitizeData(item));
        });
        await batch.commit();
      }
    } else {
      const curr = getFromStorage<GalleryItem[]>('gallery', []);
      const newItems = items.map((item, index) => ({ ...item, id: Date.now().toString() + index }));
      saveToStorage('gallery', [...curr, ...newItems]);
    }
    return dataService.fetchGalleryItems();
  },
  deleteGalleryItem: async (id: string) => {
    if (db) await deleteDoc(doc(db, 'gallery', id));
    else {
      const curr = getFromStorage<GalleryItem[]>('gallery', []);
      saveToStorage('gallery', curr.filter(x => x.id !== id));
    }
    return dataService.fetchGalleryItems();
  },
  deleteGalleryItems: async (ids: string[]) => {
    if (db) {
      const chunkSize = 50;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(id => {
          const docRef = doc(db, 'gallery', id);
          batch.delete(docRef);
        });
        await batch.commit();
      }
    } else {
      const curr = getFromStorage<GalleryItem[]>('gallery', []);
      saveToStorage('gallery', curr.filter(x => !ids.includes(x.id)));
    }
    return dataService.fetchGalleryItems();
  },

  // --- ASSINIE : REGISTRATIONS ---
  fetchAssinieRegistrations: () => getAll<AssinieRegistration>('assinie_registrations', []),
  addAssinieRegistration: async (r: Omit<AssinieRegistration, 'id'>) => {
    const data = sanitizeData(r);
    if (db) {
      await addDoc(collection(db, 'assinie_registrations'), data);
      return dataService.fetchAssinieRegistrations();
    }
    const curr = getFromStorage<AssinieRegistration[]>('assinie_registrations', []);
    saveToStorage('assinie_registrations', [...curr, { ...data, id: Date.now().toString() }]);
    return dataService.fetchAssinieRegistrations();
  },
  updateAssinieRegistration: async (r: AssinieRegistration) => {
    const { id, ...data } = sanitizeData(r);
    if (db) {
      await updateDoc(doc(db, 'assinie_registrations', id), data);
      return dataService.fetchAssinieRegistrations();
    }
    const curr = getFromStorage<AssinieRegistration[]>('assinie_registrations', []);
    saveToStorage('assinie_registrations', curr.map(x => x.id === id ? { ...data, id } : x));
    return dataService.fetchAssinieRegistrations();
  },
  deleteAssinieRegistration: async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, 'assinie_registrations', id));
      return dataService.fetchAssinieRegistrations();
    }
    const curr = getFromStorage<AssinieRegistration[]>('assinie_registrations', []);
    saveToStorage('assinie_registrations', curr.filter(x => x.id !== id));
    return dataService.fetchAssinieRegistrations();
  },

  // --- NAZA : REGISTRATIONS ---
  fetchNazaRegistrations: () => getAll<NazaRegistration>('naza_registrations', []),
  addNazaRegistration: async (r: Omit<NazaRegistration, 'id'>) => {
    const data = sanitizeData(r);
    if (db) {
      await addDoc(collection(db, 'naza_registrations'), data);
      return dataService.fetchNazaRegistrations();
    }
    const curr = getFromStorage<NazaRegistration[]>('naza_registrations', []);
    saveToStorage('naza_registrations', [...curr, { ...data, id: Date.now().toString() }]);
    return dataService.fetchNazaRegistrations();
  },
  updateNazaRegistration: async (r: NazaRegistration) => {
    const { id, ...data } = sanitizeData(r);
    if (db) {
      await updateDoc(doc(db, 'naza_registrations', id), data);
      return dataService.fetchNazaRegistrations();
    }
    const curr = getFromStorage<NazaRegistration[]>('naza_registrations', []);
    saveToStorage('naza_registrations', curr.map(x => x.id === id ? { ...data, id } : x));
    return dataService.fetchNazaRegistrations();
  },
  deleteNazaRegistration: async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, 'naza_registrations', id));
      return dataService.fetchNazaRegistrations();
    }
    const curr = getFromStorage<NazaRegistration[]>('naza_registrations', []);
    saveToStorage('naza_registrations', curr.filter(x => x.id !== id));
    return dataService.fetchNazaRegistrations();
  },

  // --- PROSPECTS CAMPAIGNS ---
  fetchProspects: () => getAll<ProspectContact>('prospect_contacts', []),
  addProspect: async (p: Omit<ProspectContact, 'id'>) => {
    const data = sanitizeData(p);
    if (db) {
      try {
        await addDoc(collection(db, 'prospect_contacts'), data);
        return dataService.fetchProspects();
      } catch (e) {
        console.warn("Firestore error adding prospect, falling back to local:", e);
      }
    }
    const curr = getFromStorage<ProspectContact[]>('prospect_contacts', []);
    saveToStorage('prospect_contacts', [...curr, { ...data, id: 'local_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5) }]);
    return dataService.fetchProspects();
  },
  updateProspect: async (p: ProspectContact) => {
    const { id, ...data } = sanitizeData(p);
    if (db) {
      try {
        await updateDoc(doc(db, 'prospect_contacts', id), data);
        return dataService.fetchProspects();
      } catch (e) {
        console.warn("Firestore error updating prospect, falling back to local:", e);
      }
    }
    const curr = getFromStorage<ProspectContact[]>('prospect_contacts', []);
    saveToStorage('prospect_contacts', curr.map(x => x.id === id ? { ...data, id } : x));
    return dataService.fetchProspects();
  },
  deleteProspect: async (id: string) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'prospect_contacts', id));
        return dataService.fetchProspects();
      } catch (e) {
        console.warn("Firestore error deleting prospect, falling back to local:", e);
      }
    }
    const curr = getFromStorage<ProspectContact[]>('prospect_contacts', []);
    saveToStorage('prospect_contacts', curr.filter(x => x.id !== id));
    return dataService.fetchProspects();
  },
  saveProspectsBulk: async (contacts: ProspectContact[]) => {
    if (db) {
      try {
        const snapshot = await getDocs(collection(db, 'prospect_contacts'));
        const deleteBatch = writeBatch(db);
        snapshot.forEach(d => deleteBatch.delete(d.ref));
        await deleteBatch.commit();

        const addBatch = writeBatch(db);
        contacts.forEach(c => {
          const docRef = doc(collection(db, 'prospect_contacts'));
          const { id, ...data } = c;
          addBatch.set(docRef, sanitizeData(data));
        });
        await addBatch.commit();
      } catch (error) {
        console.warn("Error saving prospects bulk in Firestore, falling back to local:", error);
        saveToStorage('prospect_contacts', contacts);
      }
    } else {
      saveToStorage('prospect_contacts', contacts);
    }
    return dataService.fetchProspects();
  },
  fetchCampaignTemplate: async (): Promise<string> => {
    if (db) {
      try {
        const docSnap = await getDoc(doc(db, 'campaign_templates', 'default'));
        if (docSnap.exists()) {
          return docSnap.data().body || '';
        }
      } catch (error) {
        console.warn("Error fetching template from Firestore:", error);
      }
    }
    return getFromStorage<string>('campaign_template_body', "Bonjour {prenom} {nom},\n\nNous avons le plaisir de vous recontacter suite à votre intérêt pour l'IFRAN. Quelles sont vos disponibilités pour un échange téléphonique ?\n\nCordialement,\nLe BDE IFRAN");
  },
  saveCampaignTemplate: async (body: string) => {
    if (db) {
      try {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'campaign_templates', 'default'), { body });
      } catch (error) {
        console.warn("Error saving template to Firestore:", error);
      }
    }
    saveToStorage('campaign_template_body', body);
    return body;
  }
};
