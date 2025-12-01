

export interface Member {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  whatsapp: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  leaderName: string;
  leaderWhatsapp: string;
  activities: string[];
  emoji?: string; // Ajout du champ emoji
}

export interface ClubRegistration {
  id: string;
  clubId: string;
  studentName: string;
  studentLevel: string;
  studentWhatsapp: string;
  date: string;
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO string
  location: string;
  description: string;
  imageUrl: string;
  status: 'upcoming' | 'past' | 'cancelled';
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventName: string;
  studentName: string;
  studentLevel: string;
  studentWhatsapp: string;
  date: string;
}

export interface Student {
  id: string;
  name: string;
  level: string; // e.g., "L1", "L2", "Master"
  hasPaid: boolean;
  paymentType?: 'Mensuel' | 'Ponctuel' | 'Autre';
  paymentDate?: string;
  amount?: number;
}

export interface Mentor {
  id: string;
  name: string;
  subject: string;
  whatsapp: string;
}

export interface CinemaSale {
  id: string;
  itemName: string; // Ex: Ticket, Popcorn, Boisson
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  buyerName?: string; // Optionnel
}

export interface DocumentRecord {
  id: string;
  type: 'email' | 'meeting' | 'finance';
  title: string;
  date: string; // Date de génération
  data: any; // Données JSON pour régénérer le PDF
}

export interface Stats {
  totalStudents: number;
  totalCollected: number;
  activeClubs: number;
  eventsCount: number;
}