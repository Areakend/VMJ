import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { claimUsername } from '../utils/storage';

export default function UsernameSetup() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        // Simple validation
        if (username.length < 3) {
            setError("Username must be at least 3 characters");
            return;
        }

        setLoading(true);
        setError('');

        try {
            await claimUsername(currentUser.uid, username.trim());
            // The auth context listener will pick this up automatically
        } catch (err) {
            console.error("Error saving username:", err);
            if (err.message === "Username already taken") {
                setError("This username is already taken. Be more original!");
            } else {
                setError("Error saving username. Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
        }}>
            <h2>One last thing...</h2>
            <p style={{ marginBottom: '2rem', color: '#888' }}>What should we call you, Legend?</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Bartender Name"
                    style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '2px solid var(--jager-green)',
                        background: '#2b2b2b',
                        color: 'white',
                        fontSize: '1.2rem',
                        textAlign: 'center'
                    }}
                    autoFocus
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        marginTop: '1rem',
                        backgroundColor: 'var(--jager-orange)',
                        color: 'black',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? 'Saving...' : 'Start Drinking'}
                </button>
            </form>
        </div>
    );
}
