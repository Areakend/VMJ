import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { claimUsername, validateUsername } from '../utils/storage';
import { Beer } from 'lucide-react';

export default function UsernameSetup() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        // Enhanced validation from storage util
        const validationError = validateUsername(username.trim());
        if (validationError) {
            setError(validationError);
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
            padding: '0 1.5rem'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
                padding: '2.5rem 2rem',
                borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                textAlign: 'center',
                width: '100%',
                maxWidth: '340px'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: '800' }}>Legendary Status</h2>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Choose your handle before we start.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--jager-orange)', fontWeight: '700', marginLeft: '4px', marginBottom: '8px', display: 'block' }}>
                            Username
                        </label>
                        <input
                            type="text"
                            className="premium-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. MasterJager"
                            style={{ width: '100%' }}
                            required
                            autoFocus
                        />
                        {error && <p style={{ color: '#ff4444', fontSize: '0.75rem', marginTop: '8px', fontWeight: '500' }}>{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="premium-button"
                        style={{ marginTop: '0.5rem' }}
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <Beer size={20} />
                                Start Drinking
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
