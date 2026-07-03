export type NurseStatus = 'at_home' | 'in_transit' | 'at_work' | 'sos';

export interface Nurse {
  id: string;
  name: string;
  initials: string;
  lat: number;
  lng: number;
  status: NurseStatus;
  battery: number;
  lastSeen: string;
  zone: string;
  phone: string;
}

export interface Vehicle {
  id: string;
  name: string;
  driver: string;
  lat: number;
  lng: number;
  speed: number;
  capacity: number;
  nursesOnBoard: number;
}
