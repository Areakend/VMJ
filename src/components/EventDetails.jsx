import { useState, useEffect } from 'react';
import { inviteToEvent, toggleEventStatus, deleteEvent, setEventStatus, removeEventDrink, addEventDrink, removeParticipant } from '../utils/events';
import { format } from 'date-fns';
import { Users, UserPlus, Trophy, Beer, ArrowLeft, Lock, Unlock, CheckCircle, Dices, Share2, Plus, Trash2, X, LogIn } from 'lucide-react';
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
            alert("Invited!");
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

    const handleGlobalStatus = async (status) => {
        if (!window.confirm(`Are you sure you want to ${status === 'open' ? 're-open' : 'close'} this event for everyone?`)) return;
        try {
            await setEventStatus(eventId, status);
        } catch (e) {
            console.error(e);
            alert("Failed to update global status");
        }
    };

    const handleDeleteEvent = async () => {
        if (!window.confirm("CRITICAL: Delete this event and all its shot records? This cannot be undone.")) return;
        try {
            await deleteEvent(eventId);
            onBack();
        } catch (e) {
            console.error(e);
            alert("Failed to delete event");
        }
    };

    const handleShareEvent = async () => {
        const base = (window.location.origin && !window.location.origin.includes('localhost'))
            ? window.location.origin
            : 'https://quiet-heliotrope-f4ea50.netlify.app';
        const link = `${base}/event?id=${eventId}`;
        const title = `Join our Jäger Event: ${event.title}`;
        const text = `Click to join "${event.title}" on Jäger Tracker!`;

        try {
            if (Capacitor.isNativePlatform()) {
                await Share.share({
                    title,
                    text: `${text} ${link}`,
                    url: `vitemonjager://event?id=${eventId}`,
                    dialogTitle: 'Share Event',
                });
            } else if (navigator.share) {
                await navigator.share({
                    title,
                    text: `${text} ${link}`,
                    url: link,
                });
            } else {
                throw new Error('Web Share not supported');
            }
        } catch (e) {
            try {
                await navigator.clipboard.writeText(`${text} ${link}`);
                alert("Link copied to clipboard! 🦌");
            } catch (err) {
                console.error('Clipboard failed', err);
                alert(`Event Link: ${link}`);
            }
        }
    };

    const handleRemoveParticipant = async (participant) => {
        if (!window.confirm(`Kick ${participant.username} from the event?`)) return;
        try {
            await removeParticipant(eventId, participant.uid);
        } catch (e) {
            console.error(e);
            alert("Failed to remove participant");
        }
    };

    const handleQuickShot = async () => {
        try {
            const shot = {
                timestamp: Date.now(),
                volume: 2,
                comment: "Event Shot! 🦌",
                eventIds: [eventId]
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



    // Check if I am a participant
    const myParticipantData = event.participants?.find(p => p.uid === currentUser.uid);
    const isParticipant = !!myParticipantData;
    const amIActive = myParticipantData?.status === 'active';

    const handleJoin = async () => {
        try {
            await inviteToEvent(eventId, currentUser.uid, userData.username);
        } catch (e) {
            console.error(e);
            alert("Failed to join");
        }
    };

    // Calculate Leaderboard
    const leaderboard = {};
    // Initialize all participants with 0
    event.participants?.forEach(p => {
        leaderboard[p.uid] = { uid: p.uid, username: p.username, shots: 0, volume: 0 };
    });

    eventDrinks.forEach(d => {
        if (!leaderboard[d.uid]) {
            // Should not happen for registered participants but handle for safety
            leaderboard[d.uid] = { uid: d.uid, username: d.username, shots: 0, volume: 0 };
        }
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>{event.title}</h1>
                    {event.creator.uid === currentUser.uid && (
                        <button
                            onClick={handleDeleteEvent}
                            style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', padding: '8px', borderRadius: '12px' }}
                        >
                            <Trash2 size={20} />
                        </button>
                    )}


                </div>
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
                    {!isParticipant ? (
                        <button
                            onClick={handleJoin}
                            style={{
                                width: '100%', background: 'linear-gradient(135deg, var(--jager-orange), #ff9f1a)', color: 'black',
                                padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '900', border: 'none',
                                boxShadow: '0 4px 15px rgba(251, 177, 36, 0.3)'
                            }}
                        >
                            <LogIn size={20} /> JOIN EVENT
                        </button>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>

                <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            My Status: {amIActive ? <CheckCircle size={16} color="var(--jager-green)" /> : <UserPlus size={16} color="#444" />}
                        </span>
                        <button
                            onClick={() => handleToggleStatus(!amIActive)}
                            disabled={!isParticipant}
                            style={{
                                background: amIActive ? 'var(--jager-green)' : '#333',
                                color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px',
                                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold',
                                opacity: !isParticipant ? 0.5 : 1
                            }}
                        >
                            {amIActive ? <Unlock size={16} /> : <Lock size={16} />}
                            {amIActive ? 'Open' : 'Closed'}
                        </button>
                    </div>

                    {/* Global Control for Creator */}
                    {event.creator.uid === currentUser.uid && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid #222', paddingTop: '1rem' }}>
                            <span style={{ fontWeight: 'bold', color: '#888', fontSize: '0.9rem' }}>Global (Admin):</span>
                            <button
                                onClick={() => handleGlobalStatus(event.status === 'open' ? 'closed' : 'open')}
                                style={{
                                    background: event.status === 'open' ? 'rgba(251, 177, 36, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    color: event.status === 'open' ? 'var(--jager-orange)' : '#666',
                                    border: '1px solid', borderColor: event.status === 'open' ? 'var(--jager-orange)' : '#444',
                                    padding: '6px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
                                }}
                            >
                                {event.status === 'open' ? 'Lock Event' : 'Unlock'}
                            </button>
                        </div>
                    )}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--jager-orange)' }}>
                                {user.shots} shots
                            </div>
                            {event.creator.uid === currentUser.uid && user.uid !== currentUser.uid && (
                                <button
                                    onClick={() => handleRemoveParticipant({ uid: user.uid, username: user.username })}
                                    style={{ background: 'transparent', border: 'none', color: '#ff4444', padding: '4px', display: 'flex' }}
                                    title="Remove from event"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {sortedLeaderboard.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>No drinks yet.</p>}
            </div>

            {/* Invite Modal Section */}
            {showInvite && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    padding: '1.5rem', backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: '#1c1c1c', width: '100%', maxWidth: '340px', borderRadius: '24px',
                        padding: '1.5rem', border: '1px solid #333', boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--jager-orange)' }}>Invite your Crew</h3>
                            <button onClick={() => setShowInvite(false)} style={{ background: 'transparent', border: 'none', color: '#666' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                            {friends.map(friend => {
                                const isInvited = event.participants.some(p => p.uid === friend.uid);
                                return (
                                    <div key={friend.uid} style={{
                                        background: isInvited ? 'rgba(53, 78, 65, 0.2)' : '#222', padding: '12px 8px', borderRadius: '16px',
                                        textAlign: 'center', border: isInvited ? '1px solid var(--jager-green)' : '1px solid transparent'
                                    }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{friend.username}</div>
                                        <button
                                            disabled={isInvited}
                                            onClick={() => handleInvite(friend)}
                                            style={{
                                                border: 'none', background: isInvited ? 'transparent' : 'var(--jager-orange)',
                                                color: isInvited ? 'var(--jager-green)' : 'black',
                                                padding: '8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', width: '100%'
                                            }}
                                        >
                                            {isInvited ? 'Added' : 'Add'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {friends.length === 0 && <p style={{ textAlign: 'center', color: '#666', margin: '2rem 0' }}>No friends found.</p>}

                        <button
                            onClick={() => setShowInvite(false)}
                            style={{
                                width: '100%', marginTop: '1.5rem', padding: '12px', background: '#333', color: 'white',
                                border: 'none', borderRadius: '12px', fontWeight: 'bold'
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}


        </div>
    );
}
