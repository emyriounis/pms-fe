import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../src/components/Header';

describe('Header component', () => {
  it('renders user greeting and triggers signOut', () => {
    const mockSignOut = jest.fn();
    const mockUser = { username: 'john_doe' };

    render(<Header user={mockUser} signOut={mockSignOut} />);

    expect(screen.getByText(/Hello john_doe/i)).toBeInTheDocument();

    const signOutBtn = screen.getByText(/Sign out/i);
    expect(signOutBtn).toBeInTheDocument();

    fireEvent.click(signOutBtn);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
