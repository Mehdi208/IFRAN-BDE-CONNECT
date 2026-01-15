
export interface Member {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  whatsapp: string;
  orderIndex?: number;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  leaderName: string;
  leaderWhatsapp: string;
  activities: string[];
  emoji?: string;
}

export interface Atelier {
  id: string;
  name: string;
  description: string;
  room: string;
  emoji: string;
  time?: string;
  orderIndex?: number;
}

export interface ClubRegistration {
  id: string;
  clubId?: string;
  atelierId?: string; // Référence à l'atelier indépendant
  studentName: string;
  studentLevel: string;
  date: string;
  isAtelier?: boolean;
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

export interface Student {
  id: string;
  name: string;
  level: string;
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
  orderIndex?: number;
}

export interface CinemaSale {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  buyerName?: string;
  seatId?: string;
  status: 'paid' | 'reserved';
}

export interface DocumentRecord {
  id: string;
  type: 'email' | 'meeting' | 'finance';
  title: string;
  date: string;
  data: any;
}

export interface Stats {
  totalStudents: number;
  totalCollected: number;
  activeClubs: number;
  eventsCount: number;
}
