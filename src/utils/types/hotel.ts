export interface Hotel {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHotelInput {
  name: string;
}
