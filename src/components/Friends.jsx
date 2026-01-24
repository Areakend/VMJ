import { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Check, X, Trash2 } from 'lucide-react';
import { sendFriendRequest, subscribeToFriends, subscribeToRequests, acceptFriendRequest, declineFriendRequest, removeFriend } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

export default function Friends() {
    const { currentUser, userData } = useAuth();
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            const unsubFriends = subscribeToFriends(currentUser.uid, (data) => {
                setFriends(data);
            });
            const unsubRequests = subscribeToRequests(currentUser.uid, (data) => {
                setRequests(data);
            });
            return () => {
                unsubFriends();
                unsubRequests();
            };
        }
    }, [currentUser]);

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        const targetUsername = searchTerm.trim();
        if (targetUsername.toLowerCase() === userData.username.toLowerCase()) {
            setError("You can't add yourself, buddy.");
            return;
        }

        if (friends.some(f => f.username.toLowerCase() === targetUsername.toLowerCase())) {
            setError("Already friends!");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await sendFriendRequest(currentUser.uid, userData.username, targetUsername);
            setSuccess(`Request sent to ${targetUsername}!`);
            setSearchTerm('');
        } catch (err) {
            console.error(err);
            if (err.message === "User not found") {
                setError("User not found via username.");
            } else if (err.message === "Already friends") {
                setError("Already friends!");
            } else {
                setError("Failed to send request.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (request) => {
        try {
            await acceptFriendRequest(currentUser.uid, userData.username, request);
        } catch (err) {
            console.error("Failed to accept:", err);
            setError("Failed to accept request.");
        }
    };

    const handleDecline = async (senderUid) => {
        try {
            await declineFriendRequest(currentUser.uid, senderUid);
        } catch (err) {
            console.error("Failed to decline:", err);
            setError("Failed to decline request.");
        }
    };

    const handleRemoveFriend = async (friendUid, friendUsername) => {
        if (window.confirm(`Are you sure you want to remove ${friendUsername} from your crew?`)) {
            try {
                await removeFriend(currentUser.uid, friendUid);
            } catch (err) {
                console.error("Failed to remove friend:", err);
                setError("Failed to remove friend.");
            }
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Search Section */}
            <div>
                <h3 style={{ color: 'var(--jager-orange)', marginBottom: '1rem' }}>Find a Drinking Buddy</h3>
                <form onSubmit={handleSendRequest} style={{ display: 'flex', gap: '8px' }}>
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

            {/* Pending Requests Section */}
            {requests.length > 0 && (
                <div style={{ textAlign: 'left' }}>
                    <h4 style={{ color: 'var(--jager-orange)', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>
                        Pending Invitations ({requests.length})
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                        {requests.map(req => (
                            <li key={req.id} style={{
                                padding: '12px',
                                background: '#222',
                                marginBottom: '8px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '32px', height: '32px',
                                        background: '#444',
                                        borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: 'bold'
                                    }}>
                                        {req.fromUsername.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{req.fromUsername}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleAccept(req)}
                                        style={{ background: 'var(--jager-green)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                                    >
                                        <Check size={18} color="white" />
                                    </button>
                                    <button
                                        onClick={() => handleDecline(req.fromUid)}
                                        style={{ background: '#444', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                                    >
                                        <X size={18} color="#ff4444" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Friends List Section */}
            <div style={{ textAlign: 'left' }}>
                <h4 style={{ color: '#888', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>
                    Your Crew ({friends.length})
                </h4>
                {friends.length === 0 && <p style={{ color: '#666', fontStyle: 'italic', marginTop: '1rem' }}>No friends yet. Drink alone?</p>}

                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                    {friends.map(friend => (
                        <li key={friend.uid} style={{
                            padding: '12px',
                            background: '#222',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '32px', height: '32px',
                                    background: 'linear-gradient(135deg, var(--jager-orange), #d99a1f)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'black', fontWeight: 'bold'
                                }}>
                                    {friend.username.charAt(0).toUpperCase()}
                                </div>
                                <span>{friend.username}</span>
                            </div>
                            <button
                                onClick={() => handleRemoveFriend(friend.uid, friend.username)}
                                style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', padding: '4px' }}
                            >
                                <Trash2 size={18} color="#666" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
