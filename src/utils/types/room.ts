export interface Room {
  id: string;
  tenantId: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  roomType: {
    id: string;
    name: string;
  };
}

export interface CreateRoomInput {
  roomNumber: string;
  roomTypeId: string;
}

export interface EditRoomInput {
  roomNumber?: string;
  roomTypeId?: string;
}
