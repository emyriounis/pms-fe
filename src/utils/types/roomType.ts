export interface RoomType {
  id: string;
  tenantId: string;
  hotelId: string;
  name: string;
  description?: string | null;
  baseNightlyRate: number;
  maxGuests: number;
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  excludeInfantsFromMaxGuests: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomTypeInput {
  name: string;
  description?: string | null;
  baseNightlyRate: number;
  maxGuests: number;
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  excludeInfantsFromMaxGuests: boolean;
}

export interface EditRoomTypeInput {
  name?: string;
  description?: string | null;
  baseNightlyRate?: number;
  maxGuests?: number;
  maxAdults?: number;
  maxChildren?: number;
  maxInfants?: number;
  excludeInfantsFromMaxGuests?: boolean;
}
