export type NurseStatus = 'waiting' | 'picked_up' | 'skipped';

export interface AssignedNurse {
  id: string;
  name: string;
  initials: string;
  lat: number;
  lng: number;
  address: string;
  zone: string;
  phone: string;
  pickupOrder: number;
  status: NurseStatus;
  etaMinutes: number;
}

export interface DriverVehicle {
  id: string;
  name: string;
  driver: string;
  lat: number;
  lng: number;
  speed: number;
  capacity: number;
  nursesOnBoard: number;
}

export interface TripHistory {
  id: string;
  date: string;
  nursesCount: number;
  totalKm: number;
  durationMinutes: number;
  shift: 'morning' | 'evening';
}
