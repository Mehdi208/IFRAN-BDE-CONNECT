
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
  atelierId?: string;
  studentName: string;
  studentLevel: string;
  date: string;
  isAtelier?: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;
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

// NOUVEAUX TYPES CANTINE
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface FoodOrder {
  id: string;
  studentName: string;
  studentFirstName: string;
  studentClass: string;
  studentPhone: string;
  items: OrderItem[];
  totalPrice: number;
  pickupDate: string;
  pickupTime: string;
  notes?: string;
  status: 'pending' | 'validated' | 'preparing' | 'ready' | 'delivered';
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  type: 'email' | 'meeting' | 'finance';
  title: string;
  date: string;
  data: any;
}

export interface GalleryItem {
  id: string;
  clubId: string;
  eventName: string;
  type: 'photo' | 'video';
  url: string;
  createdAt: string;
}

export interface AssinieRegistration {
  id: string;
  studentName: string;
  studentClass: string;
  phone: string;
  needsGlaciere?: boolean;
  registrationDate: string;
}

export interface NazaRegistration {
  id: string;
  studentName: string;
  studentClass: string;
  phone: string;
  registrationDate: string;
}

export interface Stats {
  totalStudents: number;
  totalCollected: number;
  activeClubs: number;
  eventsCount: number;
}

export interface ProspectContact {
  id: string;
  userId?: string;
  category?: 'sheets' | 'descartes' | string; // 'sheets' = 1er Google Sheets, 'descartes' = Lycée International Descartes
  firstName: string;
  lastName: string;
  phone: string; // Tél. jeune
  parentPhone?: string; // Tél. parent
  status: 'to_do' | 'in_progress' | 'sent' | 'ignored';
  notes?: string;
  whatsappLink?: string; // Stored link from CSV if exists
  lastContactedAt?: string;
  customFields?: Record<string, string>; // Extra columns from CSV/Sheets
}

export interface CampaignTemplate {
  id: string;
  body: string;
}

