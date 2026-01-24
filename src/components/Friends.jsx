import { useState, useEffect } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { addFriend, subscribeToFriends, isUsernameAvailable } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

export default function Friends() {
    const { currentUser, userData } = useAuth();
    const [friends, setFriends] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            const unsubscribe = subscribeToFriends(currentUser.uid, (data) => {
                setFriends(data);
            });
            return () => unsubscribe();
        }
    }, [currentUser]);

    const handleAddFriend = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        const targetUsername = searchTerm.trim();
        if (targetUsername.toLowerCase() === userData.username.toLowerCase()) {
            setError("You can't add yourself, buddy.");
            return;
        }

        // Check if already friend
        if (friends.some(f => f.username.toLowerCase() === targetUsername.toLowerCase())) {
            setError("Already friends!");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await addFriend(currentUser.uid, userData.username, targetUsername);
            setSuccess(`Added ${targetUsername}!`);
            setSearchTerm('');
        } catch (err) {
            console.error(err);
            if (err.message === "User not found") {
                setError("User not found via username.");
            } else if (err.message === "You cannot add yourself") {
                setError("You cannot add yourself.");
            } else {
                setError("Failed to add friend.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: 'var(--jager-orange)', marginBottom: '1rem' }}>Find a Drinking Buddy</h3>
                <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search username..."
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                borderRadius: '8px',
                                border: '1px solid #444',
                                background: '#2b2b2b',
                                color: 'white',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'var(--jager-green)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0 12px',
                            cursor: 'pointer'
                        }}
                    >
                        <UserPlus size={20} />
                    </button>
                </form>
                {error && <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '5px' }}>{error}</p>}
                {success && <p style={{ color: 'var(--jager-green)', fontSize: '0.8rem', marginTop: '5px' }}>{success}</p>}
            </div>

            <div style={{ textAlign: 'left' }}>
                <h4 style={{ color: '#888', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>
                    Your Crew ({friends.length})
                </h4>
                {friends.length === 0 && <p style={{ color: '#666', fontStyle: 'italic' }}>No friends yet. Drink alone?</p>}

                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {friends.map(friend => (
                        <li key={friend.uid} style={{
                            padding: '12px',
                            background: '#222',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <div style={{
                                width: '32px', height: '32px',
                                background: 'var(--jager-orange)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'black', fontWeight: 'bold'
                            }}>
                                {friend.username.charAt(0).toUpperCase()}
                            </div>
                            <span>{friend.username}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
