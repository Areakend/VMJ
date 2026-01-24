import { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Check, X, Trash2, Droplets, Beer, ChevronRight } from 'lucide-react';
import { sendFriendRequest, subscribeToFriends, subscribeToRequests, acceptFriendRequest, declineFriendRequest, removeFriend, subscribeToDrinks } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

function FriendDetail({ friend, onClose }) {
    const [drinks, setDrinks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToDrinks(friend.uid, (data) => {
            setDrinks(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [friend.uid]);

    const totalVolumeCl = drinks.reduce((acc, curr) => acc + (curr.volume || 2), 0);

    const getLastNightVolume = () => {
        const now = new Date();
        const middayToday = new Date(now);
        middayToday.setHours(12, 0, 0, 0);

        let start, end;
        if (now.getHours() >= 12) {
            start = middayToday.getTime();
            end = middayToday.getTime() + (24 * 60 * 60 * 1000);
        } else {
            start = middayToday.getTime() - (24 * 60 * 60 * 1000);
            end = middayToday.getTime();
        }

        return drinks
            .filter(d => d.timestamp >= start && d.timestamp < end)
            .reduce((acc, curr) => acc + (curr.volume || 2), 0);
    };

    const lastNightVolume = getLastNightVolume();

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', zIndex: 2000,
            padding: '1rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px',
                        background: 'var(--jager-orange)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'black', fontWeight: 'bold'
                    }}>
                        {friend.username.charAt(0).toUpperCase()}
                    </div>
                    <h2 style={{ margin: 0, color: 'white' }}>{friend.username}</h2>
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '2rem' }}>
                <div style={{ background: '#222', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--jager-orange)' }}>{drinks.length}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>Total Shots</span>
                </div>
                <div style={{ background: '#222', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <strong style={{ display: 'block', fontSize: '1.2rem', color: 'white' }}>{(totalVolumeCl / 100).toFixed(1)}L</strong>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>Volume</span>
                </div>
                <div style={{ background: lastNightVolume > 0 ? 'rgba(251, 177, 36, 0.2)' : '#222', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <strong style={{ display: 'block', fontSize: '1.2rem', color: lastNightVolume > 0 ? '#fbb124' : 'white' }}>{lastNightVolume}cl</strong>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>Last Night</span>
                </div>
            </div>

            <h4 style={{ color: '#888', marginBottom: '1rem' }}>Recent History</h4>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#666' }}>Loading drinks...</p>
                ) : drinks.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>This friend is suspiciously sober...</p>
                ) : (
                    drinks.slice(0, 20).map(drink => (
                        <div key={drink.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '8px', borderRadius: '8px'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: '#eee' }}>{format(new Date(drink.timestamp), 'HH:mm')} <span style={{ color: '#666', fontSize: '0.75rem' }}>{format(new Date(drink.timestamp), 'dd MMM')}</span></div>
                                <div style={{ fontSize: '0.7rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Droplets size={10} /> {drink.volume || 2}cl
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={onClose}
                style={{
                    marginTop: '1rem',
                    padding: '15px',
                    background: 'var(--jager-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                Back to Crew
            </button>
        </div>
    );
}

export default function Friends() {
    const { currentUser, userData } = useAuth();
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);

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
                        <li key={friend.uid}
                            onClick={() => setSelectedFriend(friend)}
                            style={{
                                padding: '12px',
                                background: '#222',
                                marginBottom: '8px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer'
                            }}
                        >
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFriend(friend.uid, friend.username);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', padding: '4px' }}
                                >
                                    <Trash2 size={18} color="#666" />
                                </button>
                                <ChevronRight size={18} color="#444" />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {selectedFriend && (
                <FriendDetail
                    friend={selectedFriend}
                    onClose={() => setSelectedFriend(null)}
                />
            )}
        </div>
    );
}
