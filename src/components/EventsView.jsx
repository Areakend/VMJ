import { useState, useEffect } from 'react';
import { subscribeToMyEvents, createEvent } from '../utils/events';
import { getCurrentLocation } from '../utils/location';
import { Calendar, Plus, Users, ChevronRight, Trophy, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function EventsView({ currentUser, userData, friends, onSelectEvent }) {
    const [events, setEvents] = useState([]);
    const [showCreate, setShowCreate] = useState(false);

    // Create Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [isPublic, setIsPublic] = useState(false);
    const [eventLocation, setEventLocation] = useState(null); // { latitude, longitude }
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (currentUser) {
            const unsub = subscribeToMyEvents(currentUser.uid, setEvents);
            return () => unsub();
        }
    }, [currentUser]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createEvent(currentUser.uid, userData.username, newTitle, newDate, isPublic, eventLocation);
            setShowCreate(false);
            setNewTitle('');
            setIsPublic(false);
            setEventLocation(null);
        } catch (err) {
            alert("Error creating event");
        }
    };

    const togglePublic = async (e) => {
        const checked = e.target.checked;
        setIsPublic(checked);
        if (checked) {
            setIsLocating(true);
            try {
                const loc = await getCurrentLocation();
                setEventLocation({
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    address: null // Could reverse geocode if needed
                });
            } catch (err) {
                console.error("Loc error", err);
                alert("Could not get location. Event will not be on map.");
                setIsPublic(false); // Revert
            } finally {
                setIsLocating(false);
            }
        } else {
            setEventLocation(null);
        }
    };

    return (
        <div style={{ paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Events</h2>
                <button
                    onClick={() => setShowCreate(true)}
                    className="premium-button"
                    style={{ width: 'auto', padding: '10px 16px', borderRadius: '12px' }}
                >
                    <Plus size={20} /> New
                </button>
            </div>

            {/* Create Modal (Inline for MVP) */}
            {showCreate && (
                <div style={{
                    marginBottom: '2rem',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h3 style={{ marginTop: 0 }}>Create New Event</h3>
                    <form onSubmit={handleCreate}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Event Name</label>
                            <input
                                type="text"
                                className="premium-input"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="e.g. Ski Trip 2026"
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Date</label>
                            <input
                                type="datetime-local"
                                className="premium-input"
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem', background: 'rgba(251, 177, 36, 0.05)', padding: '12px', borderRadius: '12px', border: isPublic ? '1px solid var(--jager-orange)' : '1px solid transparent' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={18} color={isPublic ? 'var(--jager-orange)' : '#666'} />
                                    <div>
                                        <span style={{ fontWeight: 'bold', color: isPublic ? 'var(--jager-orange)' : 'white' }}>Public Event</span>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Visible to everyone on the map</div>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={togglePublic}
                                    style={{ transform: 'scale(1.2)' }}
                                />
                            </label>
                            {isLocating && <div style={{ fontSize: '0.75rem', color: '#fbb124', marginTop: '4px' }}>📍 Acquiring location...</div>}
                            {eventLocation && <div style={{ fontSize: '0.75rem', color: '#var(--jager-green)', marginTop: '4px' }}>✅ Location set</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#333', color: 'white'
                                }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="premium-button" style={{ flex: 1 }}>
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Events List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {events.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
                        <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No events yet. Start the party!</p>
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id}
                            onClick={() => onSelectEvent(event.id)}
                            style={{
                                background: '#1c1c1c',
                                borderRadius: '16px',
                                padding: '1.2rem',
                                border: '1px solid #333',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{event.title}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                        {format(new Date(event.date), "MMM d, h:mm a")}
                                    </span>
                                </div>
                                <div style={{
                                    background: 'rgba(251, 177, 36, 0.1)',
                                    color: 'var(--jager-orange)',
                                    padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold'
                                }}>
                                    {event.status === 'open' ? 'OPEN' : 'CLOSED'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Users size={16} color="#666" />
                                    <span style={{ fontSize: '0.9rem' }}>{event.participants?.length || 0} crew</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Trophy size={16} color="#666" />
                                    <span style={{ fontSize: '0.9rem' }}>{event.totalShots || 0} shots</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
