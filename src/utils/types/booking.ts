export interface Booking {
  id: string;
  tenantId: string;
  hotelId: string;
  roomTypeId: string;
  roomId?: string | null;
  guestFirstName: string;
  guestLastName: string;
  guestPhone: string;
  channel: 'Direct' | 'Booking';
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  infants: number;
  totalPrice: number;
  specialRequests?: string | null;
  internalNotes?: string | null;
  createdAt: string;
  roomType: {
    id: string;
    name: string;
  };
  room?: {
    id: string;
    roomNumber: string;
  } | null;
}

export interface CreateBookingInput {
  guestFirstName: string;
  guestLastName: string;
  guestPhone: string;
  channel: 'Direct' | 'Booking';
  checkInDate: string;
  checkOutDate: string;
  roomTypeId: string;
  roomId?: string | null;
  adults: number;
  children: number;
  infants: number;
  specialRequests?: string | null;
  internalNotes?: string | null;
}

export interface AvailableRoomTypeOption {
  roomTypeId: string;
  name: string;
  description?: string | null;
  availableRoomsCount: number;
  totalPrice: number;
  nightlyRatesBreakdown: Array<{
    date: string;
    rate: number;
    isCustom: boolean;
  }>;
  maxGuests: number;
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  excludeInfantsFromMaxGuests: boolean;
}
