import React from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';

export default function AppMinimal() {
    const { currentUser, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!currentUser) return <Login />;

    return (
        <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>
            <h1>Minimal Mode Active</h1>
            <p>If you see this, the environment and AuthContext are working perfectly.</p>
        </div>
    );
}
