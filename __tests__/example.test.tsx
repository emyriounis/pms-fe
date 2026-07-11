import { render, screen, waitFor } from '@testing-library/react';
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
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Tenant Admin Dashboard/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Role: tenant_admin/i)).toBeInTheDocument();
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
});
