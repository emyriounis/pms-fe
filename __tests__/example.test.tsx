import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../src/App';
import { fetchUserAttributes } from 'aws-amplify/auth';

// Mock the Authenticator so we can test the App's content directly
jest.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children }: any) =>
    children({ signOut: jest.fn(), user: { username: 'testuser' } }),
}));

// Mock fetchUserAttributes globally
jest.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: jest.fn(),
}));

// Mock the fetcher utility so that components calling API during render don't throw errors
jest.mock('../src/lib/fetcher', () => ({
  fetcher: jest.fn().mockImplementation((path) => {
    if (path === '/tenants') {
      return Promise.resolve([]);
    }
    return Promise.resolve({});
  }),
  HttpError: class extends Error {
    status: number;
    statusText: string;
    constructor(status: number, statusText: string) {
      super();
      this.status = status;
      this.statusText = statusText;
    }
  },
}));

describe('App role rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Super Admin Screen if custom:role is super_admin', async () => {
    (fetchUserAttributes as jest.Mock).mockResolvedValue({
      email: 'admin@example.com',
      'custom:role': 'super_admin',
    });

    render(<App />);

    const text = screen.getByText(/Hello testuser/i);
    expect(text).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Super Admin Dashboard/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Register, monitor, and manage client tenants/i)).toBeInTheDocument();
  });

  it('renders Tenant Admin Screen if custom:role is tenant_admin', async () => {
    (fetchUserAttributes as jest.Mock).mockResolvedValue({
      email: 'tenant@example.com',
      'custom:role': 'tenant_admin',
      'custom:tenantId': 'test-tenant-uuid',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Tenant Admin Dashboard/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Manage hotels, configurations, rooms/i)).toBeInTheDocument();
  });

  it('renders Access Denied / No permissions if custom:role is anything else', async () => {
    (fetchUserAttributes as jest.Mock).mockResolvedValue({
      email: 'user@example.com',
      'custom:role': 'editor',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/You do not have permissions to access this screen/i),
    ).toBeInTheDocument();
  });

  it('renders Bulk Update Rates button when a room type is selected under calendar rates tab', async () => {
    const mockHotel = {
      id: 'hotel-1',
      tenantId: 'test-tenant-uuid',
      name: 'Grand Resort',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mockRoomType = {
      id: 'rt-1',
      hotelId: 'hotel-1',
      name: 'Deluxe Room',
      description: 'A cozy deluxe room',
      baseNightlyRate: 150,
      maxGuests: 2,
      maxAdults: 2,
      maxChildren: 0,
      maxInfants: 0,
      excludeInfantsFromMaxGuests: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (fetchUserAttributes as jest.Mock).mockResolvedValue({
      email: 'tenant@example.com',
      'custom:role': 'tenant_admin',
      'custom:tenantId': 'test-tenant-uuid',
    });

    const { fetcher } = require('../src/lib/fetcher');
    (fetcher as jest.Mock).mockImplementation((path: string) => {
      if (path.endsWith('/hotels')) {
        return Promise.resolve([mockHotel]);
      }
      if (path.endsWith('/room-types')) {
        return Promise.resolve([mockRoomType]);
      }
      if (path.includes('/rates')) {
        return Promise.resolve([]);
      }
      if (path.includes('/rooms')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    render(<App />);

    // Expand the hotel row
    const expandBtn = await screen.findByRole('button', { name: /Expand/i });
    expect(expandBtn).toBeInTheDocument();
    fireEvent.click(expandBtn);

    // Click Calendar Rates tab
    const ratesTabBtn = await screen.findByRole('button', { name: /Calendar Rates/i });
    expect(ratesTabBtn).toBeInTheDocument();
    fireEvent.click(ratesTabBtn);

    // Verify select dropdown and bulk update button are visible
    const selectEl = await screen.findByRole('combobox');
    expect(selectEl).toBeInTheDocument();

    const bulkBtn = await screen.findByRole('button', { name: /Bulk Update Rates/i });
    expect(bulkBtn).toBeInTheDocument();
    fireEvent.click(bulkBtn);

    // Verify modal elements are visible
    await waitFor(() => {
      expect(screen.getByText(/Bulk Update Rates for Grand Resort/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nightly Rate/i)).toBeInTheDocument();
  });
});
