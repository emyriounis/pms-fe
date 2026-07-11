export interface RoomTypeRate {
  id: string;
  tenantId: string;
  hotelId: string;
  roomTypeId: string;
  calendarDate: string;
  nightlyRate: number;
}

export interface CreateRoomTypeRateInput {
  calendarDate: string;
  nightlyRate: number;
}

export interface EditRoomTypeRateInput {
  nightlyRate?: number;
  calendarDate?: string;
}
