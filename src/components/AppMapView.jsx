import { Users, Target, Check, ChevronRight } from 'lucide-react';
import DrinkMap from './DrinkMap';

export default function AppMapView({
    mapShowEvents,
    setMapShowEvents,
    selectedMapFilterBuddies,
    setSelectedMapFilterBuddies,
    setShowMapFilterModal,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sharedStats,
    mapDrinks,
    locationState,
    publicEvents,
    onSelectEvent,
    mapSharedOnly,
    currentUser
}) {
    // Filter logic moved here or kept in App.jsx? 
    // The filter logic for `drinks` prop of `DrinkMap` was inline in `App.jsx`.
    // We should move it here for cleaner App.jsx.

    const filteredMapDrinks = mapDrinks.filter(d => {
        const date = new Date(d.timestamp);
        const afterStart = !startDate || date >= new Date(startDate);
        const beforeEnd = !endDate || date <= new Date(endDate);
        if (!afterStart || !beforeEnd) return false;

        if (mapSharedOnly) {
            // If it's my drink, it must have a buddy that is in selectedMapFilterBuddies
            if (d.userId === currentUser.uid) {
                return d.buddies && d.buddies.some(buddy => selectedMapFilterBuddies.some(sb => sb.uid === buddy.uid));
            } else {
                // If it's a buddy's drink, I must be in their buddies list
                // (and they must be in my selected list, which is already true by mapDrinks content)
                return d.buddies && d.buddies.some(b => b.uid === currentUser.uid);
            }
        }
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Map Filters Header */}
            <div className="filter-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>MAP FILTERS</span>
                    {sharedStats && (
                        <div className="shared-stats-badge">
                            <Target size={12} /> {sharedStats.shots} shots together
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(251, 177, 36, 0.05)', borderRadius: '12px', border: mapShowEvents ? '1px solid var(--jager-orange)' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                        <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                            <input
                                type="checkbox"
                                checked={mapShowEvents}
                                onChange={e => setMapShowEvents(e.target.checked)}
                                style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                            />
                            <div style={{
                                width: '20px', height: '20px', borderRadius: '6px',
                                border: '2px solid ' + (mapShowEvents ? '#fbb124' : '#666'),
                                background: mapShowEvents ? '#fbb124' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {mapShowEvents && <Check size={14} color="black" strokeWidth={3} />}
                            </div>
                        </div>
                        <span style={{ fontSize: '0.9rem', color: mapShowEvents ? '#fbb124' : '#888', fontWeight: 'bold' }}>Show Public Events 🌟</span>
                    </label>
                </div>

                <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                    <button
                        onClick={() => setShowMapFilterModal(true)}
                        style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={16} color={selectedMapFilterBuddies.length > 0 ? '#fbb124' : '#666'} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                {selectedMapFilterBuddies.length > 0
                                    ? `${selectedMapFilterBuddies.length} Crew Selected`
                                    : 'Select Crew'}
                            </span>
                        </div>
                        <ChevronRight size={16} color="#444" />
                    </button>
                    {selectedMapFilterBuddies.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {selectedMapFilterBuddies.map(b => (
                                <span
                                    key={b.uid}
                                    onClick={() => setSelectedMapFilterBuddies(selectedMapFilterBuddies.filter(fb => fb.uid !== b.uid))}
                                    style={{
                                        fontSize: '0.7rem', background: 'rgba(251, 177, 36, 0.08)',
                                        color: '#fbb124', padding: '3px 8px', borderRadius: '10px',
                                        border: '1px solid rgba(251, 177, 36, 0.2)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                >
                                    {b.username} &times;
                                </span>
                            ))}
                            <button
                                onClick={() => setSelectedMapFilterBuddies([])}
                                style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '0.7rem', padding: '3px 8px' }}
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                <div className="date-filter-row">
                    <input type="date" className="date-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span style={{ color: '#444' }}>→</span>
                    <input type="date" className="date-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    {(startDate || endDate) && <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ background: 'transparent', border: 'none', color: '#fbb124', fontSize: '1.2rem' }}>&times;</button>}
                </div>
            </div>

            <div className="map-view-container" style={{ position: 'relative' }}>
                <DrinkMap
                    key={selectedMapFilterBuddies.length + startDate + endDate}
                    drinks={filteredMapDrinks}
                    userLocation={locationState}
                    publicEvents={publicEvents}
                    showEvents={mapShowEvents}
                    onSelectEvent={onSelectEvent}
                />
            </div>
        </div>
    );
}
