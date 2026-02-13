import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../components/Sidebar';

// Mock the useAuth hook
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        updateUsername: vi.fn(),
        deleteAccount: vi.fn()
    })
}));

describe('Sidebar component', () => {
    const mockProps = {
        isOpen: true,
        onClose: vi.fn(),
        userData: { username: 'TestUser' },
        totalDrinks: 42,
        onLogout: vi.fn(),
        onShowHelp: vi.fn()
    };

    it('renders user profile when open', () => {
        render(<Sidebar {...mockProps} />);

        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('TestUser')).toBeInTheDocument();
        expect(screen.getByText('42 lifetime shots')).toBeInTheDocument();
    });

    it('renders menu items', () => {
        render(<Sidebar {...mockProps} />);

        expect(screen.getByText('App Guide')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
        render(<Sidebar {...mockProps} />);

        // Find the X button (first one in the sidebar header)
        const closeButtons = screen.getAllByRole('button');
        fireEvent.click(closeButtons[0]); // The first button is the X close button

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('calls onShowHelp when App Guide clicked', () => {
        render(<Sidebar {...mockProps} />);

        fireEvent.click(screen.getByText('App Guide'));

        expect(mockProps.onShowHelp).toHaveBeenCalled();
        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('calls onLogout when Logout clicked', () => {
        render(<Sidebar {...mockProps} />);

        fireEvent.click(screen.getByText('Logout'));

        expect(mockProps.onLogout).toHaveBeenCalled();
    });

    it('shows about text when About is clicked', () => {
        render(<Sidebar {...mockProps} />);

        fireEvent.click(screen.getByText('About'));

        expect(screen.getByText(/independent fan project/i)).toBeInTheDocument();
    });

});
