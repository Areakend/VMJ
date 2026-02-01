import { useState, useEffect } from 'react';
import { inviteToEvent, toggleEventStatus } from '../utils/events';
import { format } from 'date-fns';
import { Users, UserPlus, Trophy, Beer, ArrowLeft, Lock, Unlock, CheckCircle, Dices, Share2, Plus } from 'lucide-react';
import { Share } from '@capacitor/share';
import { db } from '../firebase';
import { onSnapshot, doc, collection, query, orderBy, where } from 'firebase/firestore';
import JagerRoulette from './JagerRoulette';

export default function EventDetails({ eventId, currentUser, userData, friends, onBack }) {
    const [event, setEvent] = useState(null);
    const [eventDrinks, setEventDrinks] = useState([]);
    const [showRoulette, setShowRoulette] = useState(false);
    const [showInvite, setShowInvite] = useState(false);

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

    const handleShareEvent = async () => {
        try {
            const link = `vitemonjager://event?id=${eventId}`;
            await Share.share({
                title: `Join our Jäger Event: ${event.title}`,
                text: `Click to join "${event.title}" on Jäger Tracker!`,
                url: link,
                dialogTitle: 'Share Event',
            });
        } catch (e) {
            console.log('Share dismissed');
        }
    };

    const handleQuickShot = async () => {
        try {
            const shot = {
                timestamp: Date.now(),
                volume: 2,
                comment: "Event Shot! 🦌",
                eventId: eventId
            };
            await addEventDrink(eventId, currentUser.uid, userData.username, shot);
            // Also add to personal log for consistency
            const { addDrink } = await import('../utils/storage');
            await addDrink(currentUser.uid, shot, userData.username);
        } catch (e) {
            console.error(e);
            alert("Failed to add shot");
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

                <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                    <button
                        onClick={handleQuickShot}
                        style={{
                            flex: 2, background: 'linear-gradient(135deg, var(--jager-orange), #ff9f1a)', color: 'black',
                            padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '900', border: 'none',
                            boxShadow: '0 4px 15px rgba(251, 177, 36, 0.3)'
                        }}
                    >
                        <Beer size={20} /> Quick Shot
                    </button>
                    <button
                        onClick={handleShareEvent}
                        style={{
                            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: 'white',
                            padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold'
                        }}
                    >
                        <Share2 size={18} /> Invite
                    </button>
                    <button
                        onClick={() => setShowInvite(!showInvite)}
                        style={{
                            flex: 1, background: showInvite ? 'var(--jager-orange)' : 'rgba(255,255,255,0.05)',
                            border: showInvite ? 'none' : '1px solid #444', color: showInvite ? 'black' : 'white',
                            padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold'
                        }}
                    >
                        <UserPlus size={18} /> {showInvite ? 'Close' : 'Crew'}
                    </button>
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

            {/* Invite Section (Conditional) */}
            {showInvite && (
                <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '20px', border: '1px solid #333', marginBottom: '2rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Invite your Crew</h3>
                    <div style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                        {friends.map(friend => {
                            const isInvited = event.participants.some(p => p.uid === friend.uid);
                            return (
                                <div key={friend.uid} style={{
                                    minWidth: '90px', background: isInvited ? 'rgba(53, 78, 65, 0.2)' : '#222', padding: '12px 8px', borderRadius: '16px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{friend.username}</div>
                                    <button
                                        disabled={isInvited}
                                        onClick={() => handleInvite(friend)}
                                        style={{
                                            border: 'none', background: isInvited ? 'transparent' : 'var(--jager-orange)',
                                            color: isInvited ? 'var(--jager-green)' : 'black',
                                            padding: '6px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', width: '100%'
                                        }}
                                    >
                                        {isInvited ? 'Added' : 'Add'}
                                    </button>
                                </div>
                            );
                        })}
                        {friends.length === 0 && <p style={{ fontSize: '0.8rem', color: '#666' }}>No friends found.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
