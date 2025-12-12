import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'reservations.json');

export interface Reservation {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  // Updated: support multiple dates
  availableDates: string[]; 
  message?: string;
  submittedAt: string;
}

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
     fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

export function getReservations(): Reservation[] {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function addReservation(reservation: Omit<Reservation, 'id' | 'submittedAt'>) {
  const reservations = getReservations();
  const newReservation: Reservation = {
    ...reservation,
    id: Math.random().toString(36).substr(2, 9),
    submittedAt: new Date().toISOString(),
  };
  reservations.push(newReservation);
  fs.writeFileSync(DB_PATH, JSON.stringify(reservations, null, 2));
  return newReservation;
}