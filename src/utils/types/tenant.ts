export interface Tenant {
  id: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  companyName: string;
}

export interface EditTenantInput {
  companyName: string;
}
