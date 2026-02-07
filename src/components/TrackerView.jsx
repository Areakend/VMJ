import { useRef } from 'react';
import { Beer, MapPin, Users, Target, Download, Upload, Droplets, Edit2, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import EditModal from './EditModal';
import CrewSelector from './CrewSelector';
import CustomVolumeSelector from './CustomVolumeSelector';
import CommentSection from './CommentSection';
import { useState } from 'react';

export default function TrackerView({
    drinks,
    handleDrink,
    loading,
    error,
    volume,
    setVolume,
    drinkComment,
    setDrinkComment,
    selectedBuddies,
    setSelectedBuddies,
    handleExport,
    handleImport,
    handleUpdateDrink,
    handleDeleteDrink,
    currentUser,
    userData,
    friends,
    editingDrink,
    setEditingDrink,
    showCrewModal,
    setShowCrewModal,
    showVolumeModal,
    setShowVolumeModal,
    showActivityFilterModal,
    setShowActivityFilterModal,
    selectedFilterBuddies,
    setSelectedFilterBuddies,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sharedStats,
    filteredDrinks,
    totalDrinks,
    totalVolumeCl,
    lastNightVolume,
    setShowMainHelp
}) {
    const fileInputRef = useRef(null);
    const [expandedCommentDrinkId, setExpandedCommentDrinkId] = useState(null);

    const toggleComments = (drinkId) => {
        if (expandedCommentDrinkId === drinkId) {
            setExpandedCommentDrinkId(null);
        } else {
            setExpandedCommentDrinkId(drinkId);
        }
    };

    return (
        <>
            {/* Stats Header */}
            <div className="stats" style={{ marginBottom: '3.5rem' }}>
                <div className="stat-item" style={{ borderTop: '2px solid rgba(255,255,255,0.05)' }}>
                    <strong>{totalDrinks}</strong>
                    <span>Total Shots</span>
                </div>
                <div className="stat-item" style={{ borderTop: '2px solid var(--jager-orange)', background: 'rgba(251, 177, 36, 0.08)', transform: 'scale(1.05)' }}>
                    <strong>{lastNightVolume}cl</strong>
                    <span>Last Night</span>
                </div>
                <div className="stat-item" style={{ borderTop: '2px solid #555' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <strong style={{ fontSize: '1.2rem' }}>{(totalVolumeCl / 70).toFixed(1)}</strong>
                        <span style={{ fontSize: '0.65rem', color: '#888', textTransform: 'lowercase' }}>bottles</span>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="main-action-area" style={{ marginBottom: '4rem' }}>
                <button
                    className="drink-button"
                    onClick={handleDrink}
                    disabled={loading}
                    style={{ width: '210px', height: '210px', boxShadow: '0 0 40px rgba(251, 177, 36, 0.1)' }}
                >
                    <Beer size={48} />
                    <span className="label" style={{ fontSize: '1.6rem' }}>{loading ? '...' : 'Cheers!'}</span>
                </button>
                {error && <div style={{ color: '#ef4444', marginTop: '15px', fontSize: '0.9rem' }}>{error}</div>}
            </div>

            {/* Volume Selection */}
            <div className="volume-container" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {[2, 4, 8, 12].map(v => (
                    <button
                        key={v}
                        onClick={() => setVolume(v)}
                        className={`volume-btn ${volume === v ? 'active' : ''}`}
                    >
                        <span>{v}cl</span>
                        <small style={{ fontSize: '0.6rem' }}>{v === 2 ? 'Shot' : v === 4 ? 'Double' : v === 8 ? 'Huge' : 'Dead'}</small>
                    </button>
                ))}
                <button
                    onClick={() => setShowVolumeModal(true)}
                    className={`volume-btn ${![2, 4, 8, 12].includes(volume) ? 'active' : ''}`}
                    style={{ borderStyle: 'dashed' }}
                >
                    <span>{![2, 4, 8, 12].includes(volume) ? `${volume}cl` : '+'}</span>
                    <small style={{ fontSize: '0.6rem' }}>Custom</small>
                </button>
            </div>

            {/* Comment */}
            <div style={{ padding: '0 15px', marginBottom: '3rem' }}>
                <input
                    type="text"
                    value={drinkComment}
                    onChange={(e) => setDrinkComment(e.target.value)}
                    placeholder="A toast for..."
                    style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '16px',
                        borderRadius: '16px',
                        color: 'white',
                        fontSize: '0.95rem',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}
                />
            </div>

            {/* Buddy Selection Overhaul */}
            <div style={{ padding: '0 15px', marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#555', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Drinking with:</label>
                <button
                    onClick={() => setShowCrewModal(true)}
                    style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '16px',
                        borderRadius: '16px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={20} color={selectedBuddies.length > 0 ? '#fbb124' : '#666'} />
                        <span style={{ fontSize: '1rem', fontWeight: '600' }}>
                            {selectedBuddies.length > 0
                                ? `${selectedBuddies.length} Crew members tagged`
                                : 'Select Crew members'}
                        </span>
                    </div>
                    {ChevronRight && <ChevronRight size={18} color="#444" />}
                </button>
                {selectedBuddies.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {selectedBuddies.map(b => (
                            <span
                                key={b.uid}
                                onClick={() => setSelectedBuddies(selectedBuddies.filter(buddy => buddy.uid !== b.uid))}
                                style={{
                                    fontSize: '0.75rem', background: 'rgba(251, 177, 36, 0.1)',
                                    color: '#fbb124', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(251, 177, 36, 0.2)',
                                    cursor: 'pointer'
                                }}
                            >
                                {b.username} &times;
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="history-container">
                <div className="filter-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>FILTER MY HISTORY:</span>
                        {sharedStats && (
                            <div className="shared-stats-badge">
                                <Users size={12} /> {sharedStats.shots} shots together
                            </div>
                        )}
                    </div>

                    <div className="date-filter-row">
                        <input type="date" className="date-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <span style={{ color: '#444' }}>→</span>
                        <input type="date" className="date-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>

                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={() => setShowActivityFilterModal(true)}
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
                                <Users size={16} color={selectedFilterBuddies.length > 0 ? '#fbb124' : '#666'} />
                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                    {selectedFilterBuddies.length > 0
                                        ? `Filtering by ${selectedFilterBuddies.length} members`
                                        : 'Filter by Crew members'}
                                </span>
                            </div>
                            <ChevronRight size={16} color="#444" />
                        </button>
                        {selectedFilterBuddies.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                                {selectedFilterBuddies.map(b => (
                                    <span
                                        key={b.uid}
                                        onClick={() => setSelectedFilterBuddies(selectedFilterBuddies.filter(fb => fb.uid !== b.uid))}
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
                                    onClick={() => setSelectedFilterBuddies([])}
                                    style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '0.7rem', padding: '3px 8px' }}
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="history-header">Recent Activity</div>

                {drinks.length === 0 && (
                    <p style={{ color: '#666', textAlign: 'center', margin: '2rem 0', fontStyle: 'italic' }}>
                        No drinks tracked yet.<br />Time to fix that?
                    </p>
                )}

                {filteredDrinks.slice(0, 10).map(drink => (
                    <div key={drink.id} style={{ marginBottom: '12px' }}>
                        <div className="history-item">
                            <div style={{ flex: 1 }}>
                                <div className="history-time">
                                    {format(new Date(drink.timestamp), 'HH:mm')}
                                    <span className="history-date"> {format(new Date(drink.timestamp), 'dd MMM')}</span>
                                </div>
                                <div className="history-meta">
                                    <span className="tag">
                                        <Droplets size={10} style={{ verticalAlign: -1, marginRight: 2 }} />
                                        {drink.volume || 2}cl
                                    </span>
                                    {drink.locationName ? (
                                        <span style={{ fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <MapPin size={10} style={{ marginRight: 2, flexShrink: 0 }} /> {drink.locationName}
                                        </span>
                                    ) : drink.latitude && (
                                        <span style={{ fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center' }}>
                                            <MapPin size={10} style={{ marginRight: 2 }} /> Map
                                        </span>
                                    )}
                                </div>
                                {drink.buddies && drink.buddies.length > 0 && (
                                    <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users size={10} />
                                        <span>with {drink.buddies.map(b => b.username).join(', ')}</span>
                                    </div>
                                )}
                                {drink.creatorId !== currentUser.uid && (
                                    <div style={{ fontSize: '0.65rem', color: '#888', fontStyle: 'italic' }}>Tagged by {drink.creatorName || 'a buddy'}</div>
                                )}
                                {/* Comment preview (if not expanded) could go here, but omitted for now to keep it clean */}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                    onClick={() => toggleComments(drink.id)}
                                    className="delete-btn"
                                    style={{ color: expandedCommentDrinkId === drink.id ? '#fbb124' : '#666' }}
                                >
                                    <Users size={16} />
                                </button>
                                <button
                                    onClick={() => setEditingDrink(drink)}
                                    className="delete-btn"
                                    style={{ color: '#888' }}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteDrink(drink)}
                                    className="delete-btn"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Render Comment Section if expanded */}
                        {expandedCommentDrinkId === drink.id && (
                            <div style={{ marginLeft: '12px', paddingLeft: '12px', borderLeft: '2px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                                <CommentSection
                                    drinkId={drink.id}
                                    ownerId={drink.userId || currentUser.uid}
                                    currentUser={currentUser}
                                    userData={userData}
                                    initialShow={true}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Import / Export */}
            <div className="utility-bar">
                <button onClick={handleExport} className="utility-btn">
                    <Download size={14} /> Export
                </button>
                <button onClick={() => fileInputRef.current.click()} className="utility-btn">
                    <Upload size={14} /> Import
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    style={{ display: 'none' }}
                    accept=".json"
                />
            </div >

            {editingDrink && (
                <EditModal
                    drink={editingDrink}
                    onClose={() => setEditingDrink(null)}
                    onSave={handleUpdateDrink}
                />
            )
            }

            {
                showCrewModal && (
                    <CrewSelector
                        friends={friends}
                        selectedBuddies={selectedBuddies}
                        onToggle={setSelectedBuddies}
                        onClose={() => setShowCrewModal(false)}
                        title="Drinking with..."
                    />
                )
            }

            {
                showActivityFilterModal && (
                    <CrewSelector
                        friends={friends}
                        selectedBuddies={selectedFilterBuddies}
                        onToggle={setSelectedFilterBuddies}
                        onClose={() => setShowActivityFilterModal(false)}
                        title="Filter Activity"
                        includeMe={true}
                        currentUserId={currentUser.uid}
                        currentUsername={userData.username}
                    />
                )
            }

            {
                showVolumeModal && (
                    <CustomVolumeSelector
                        volume={volume}
                        onSelect={setVolume}
                        onClose={() => setShowVolumeModal(false)}
                    />
                )
            }
        </>
    );
}
