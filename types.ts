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
  level: string; // e.g., "L1", "L2", "Master"
  hasPaid: boolean;
  paymentDate?: string;
  amount?: number;
}

export interface Mentor {
  id: string;
  name: string;
  subject: string;
  whatsapp: string;
}

export interface Stats {
  totalStudents: number;
  totalCollected: number;
  activeClubs: number;
  eventsCount: number;
}