import { render, screen } from '@testing-library/react';
import App from '../src/App';

// Mock the Authenticator so we can test the App's content directly
jest.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children }: any) =>
    children({ signOut: jest.fn(), user: { username: 'testuser' } }),
}));

describe('example', () => {
  it('renders the React app content', () => {
    render(<App />);

    // The Authenticator is bypassed, so we should see the welcome text
    const text = screen.getByText(/Hello testuser/i);
    expect(text).toBeInTheDocument();

    const signOutBtn = screen.getByText(/Sign out/i);
    expect(signOutBtn).toBeInTheDocument();
  });
});
