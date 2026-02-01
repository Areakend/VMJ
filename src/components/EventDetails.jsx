import { useState, useEffect } from 'react';
import { inviteToEvent, toggleEventStatus } from '../utils/events';
import { format } from 'date-fns';
import { Users, UserPlus, Trophy, Beer, ArrowLeft, Lock, Unlock, CheckCircle, Dices } from 'lucide-react';
import { db } from '../firebase';
import { onSnapshot, doc, collection, query, orderBy, where } from 'firebase/firestore';
import JagerRoulette from './JagerRoulette';

export default function EventDetails({ eventId, currentUser, userData, friends, onBack }) {
    const [event, setEvent] = useState(null);
    const [eventDrinks, setEventDrinks] = useState([]);
    const [showRoulette, setShowRoulette] = useState(false);

    // Subscribe to Event Data
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "events", eventId), (doc) => {
            if (doc.exists()) {
                setEvent({ id: doc.id, ...doc.data() });
            }
        });
        return () => unsub();
    }, [eventId]);

    // Subscribe to Event Drinks for leaderboard
    useEffect(() => {
        // Query drinks in this event
        const q = query(collection(db, "events", eventId, "drinks"), orderBy("timestamp", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const drinks = snap.docs.map(d => d.data());
            setEventDrinks(drinks);
        });
        return () => unsub();
    }, [eventId]);

    const handleInvite = async (friend) => {
        if (!event) return;
        try {
            // Check if already invited
            if (event.participants.some(p => p.uid === friend.uid)) {
                alert("Already invited!");
                return;
            }
            await inviteToEvent(eventId, friend.uid, friend.username);
        } catch (e) {
            console.error(e);
            alert("Failed to invite");
        }
    };

    const handleToggleStatus = async (isActive) => {
        try {
            await toggleEventStatus(eventId, currentUser.uid, isActive);
        } catch (e) {
            console.error(e);
        }
    };

    if (!event) return <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;

    const myParticipantData = event.participants.find(p => p.uid === currentUser.uid);
    const amIActive = myParticipantData?.status === 'active';

    // Calculate Leaderboard
    const leaderboard = {};
    eventDrinks.forEach(d => {
        if (!leaderboard[d.uid]) leaderboard[d.uid] = { username: d.username, shots: 0, volume: 0 };
        leaderboard[d.uid].shots += 1;
        leaderboard[d.uid].volume += d.volume || 0;
    });

    const sortedLeaderboard = Object.values(leaderboard).sort((a, b) => b.shots - a.shots);

    return (
        <div style={{ paddingBottom: '100px' }}>
            <button
                onClick={onBack}
                style={{ background: 'transparent', border: 'none', color: '#888', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '1rem', padding: 0 }}
            >
                <ArrowLeft size={18} /> Back to Events
            </button>

            <div style={{
                background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
                borderRadius: '24px', padding: '1.5rem', marginBottom: '1.5rem',
                border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                <h1 style={{ margin: 0, fontSize: '2rem', marginBottom: '0.5rem' }}>{event.title}</h1>
                <p style={{ color: '#888', margin: 0, marginBottom: '1.5rem' }}>{format(new Date(event.date), "EEEE, MMMM do, h:mm a")}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--jager-orange)' }}>{event.totalShots || 0}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Total Shots</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{((event.totalVolume || 0) / 70).toFixed(1)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Bottles</div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 'bold' }}>My Satus:</span>
                        <button
                            onClick={() => handleToggleStatus(!amIActive)}
                            style={{
                                background: amIActive ? 'var(--jager-green)' : '#333',
                                color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px',
                                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
                            }}
                        >
                            {amIActive ? <Unlock size={16} /> : <Lock size={16} />}
                            {amIActive ? 'Open (Drinking)' : 'Closed'}
                        </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>
                        {amIActive ? "Drinks you add will be tagged to this event." : "Drinks you add currently go to your personal log only."}
                    </p>
                </div>
            </div>

            {/* Leaderboard / Participants */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Leaderboard</h3>
                <button
                    onClick={() => setShowRoulette(true)}
                    style={{
                        background: 'rgba(251, 177, 36, 0.15)', color: 'var(--jager-orange)',
                        border: 'none', borderRadius: '12px', padding: '6px 12px',
                        fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <Dices size={16} /> Roulette
                </button>
            </div>

            {showRoulette && (
                <JagerRoulette
                    participants={event.participants || []}
                    onClose={() => setShowRoulette(false)}
                />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {sortedLeaderboard.map((user, idx) => (
                    <div key={idx} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: '#1c1c1c', padding: '1rem', borderRadius: '12px', border: '1px solid #333'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? 'gold' : '#444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'black'
                            }}>
                                {idx + 1}
                            </div>
                            <span style={{ fontWeight: 'bold' }}>{user.username}</span>
                        </div>
                        <div style={{ fontWeight: 'bold', color: 'var(--jager-orange)' }}>
                            {user.shots} shots
                        </div>
                    </div>
                ))}
                {sortedLeaderboard.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>No drinks yet.</p>}
            </div>

            {/* Invite Section */}
            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem' }}>Invite Crew</h3>
            <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '1rem' }}>
                {friends.map(friend => {
                    const isInvited = event.participants.some(p => p.uid === friend.uid);
                    return (
                        <div key={friend.uid} style={{
                            minWidth: '100px', background: '#222', padding: '1rem', borderRadius: '12px',
                            textAlign: 'center', opacity: isInvited ? 0.5 : 1
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.username}</div>
                            <button
                                disabled={isInvited}
                                onClick={() => handleInvite(friend)}
                                style={{
                                    border: 'none', background: isInvited ? 'transparent' : 'var(--jager-orange)',
                                    color: isInvited ? '#888' : 'black',
                                    padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', width: '100%'
                                }}
                            >
                                {isInvited ? 'Invited' : 'Invite'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
