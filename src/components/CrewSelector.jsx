import { useState } from 'react';
import { Search, X, Users, Check } from 'lucide-react';

export default function CrewSelector({
    friends,
    selectedBuddies,
    onToggle,
    onClose,
    title = "Select Crew",
    includeMe = false,
    currentUserId = null,
    currentUsername = "Me",
    showSharedToggle = false,
    sharedOnly = false,
    onToggleShared = null
}) {
    const [search, setSearch] = useState('');

    const allOptions = includeMe
        ? [{ uid: currentUserId, username: currentUsername }, ...friends]
        : friends;

    const filteredOptions = allOptions.filter(f =>
        f.username.toLowerCase().includes(search.toLowerCase())
    );

    const isSelected = (uid) => selectedBuddies.some(b => b.uid === uid);

    const handleToggleAll = () => {
        if (selectedBuddies.length === allOptions.length) {
            onToggle([]); // Clear
        } else {
            onToggle(allOptions.map(f => ({ uid: f.uid, username: f.username })));
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
            padding: '1rem', backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: '#1c1c1c', width: '100%', maxWidth: '360px',
                borderRadius: '24px', padding: '1.5rem', border: '1px solid #333',
                display: 'flex', flexDirection: 'column', maxHeight: '80vh'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--jager-orange)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={20} /> {title}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                        type="text"
                        className="premium-input"
                        placeholder="Search friend..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                    <button
                        onClick={handleToggleAll}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '10px', background: '#333', border: 'none',
                            color: 'white', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        {selectedBuddies.length === allOptions.length ? 'Clear All' : 'Select All'}
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '4px' }}>
                    {filteredOptions.map(option => {
                        const active = isSelected(option.uid);
                        return (
                            <div
                                key={option.uid}
                                onClick={() => {
                                    if (active) {
                                        onToggle(selectedBuddies.filter(b => b.uid !== option.uid));
                                    } else {
                                        onToggle([...selectedBuddies, { uid: option.uid, username: option.username }]);
                                    }
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px', borderRadius: '12px', background: active ? 'rgba(251, 177, 36, 0.1)' : 'transparent',
                                    cursor: 'pointer', border: '1px solid', borderColor: active ? '#fbb124' : 'transparent',
                                    marginBottom: '4px', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: option.uid === currentUserId ? 'var(--jager-orange)' : '#444',
                                        color: option.uid === currentUserId ? 'black' : 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}>
                                        {option.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ color: active ? 'white' : '#888', fontWeight: active ? '600' : '400' }}>
                                        {option.username} {option.uid === currentUserId ? "(You)" : ""}
                                    </span>
                                </div>
                                {active ? <Check size={18} color="#fbb124" /> : <div style={{ width: 18, height: 18, border: '1px solid #444', borderRadius: '4px' }} />}
                            </div>
                        )
                    })}
                    {filteredOptions.length === 0 && <p style={{ textAlign: 'center', color: '#666', marginTop: '1rem' }}>No matches found.</p>}
                </div>

                {showSharedToggle && onToggleShared && (
                    <div
                        onClick={() => onToggleShared(!sharedOnly)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px', background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px', marginBottom: '1.2rem', cursor: 'pointer',
                            border: '1px solid', borderColor: sharedOnly ? 'var(--jager-orange)' : 'rgba(255,255,255,0.05)'
                        }}
                    >
                        <span style={{ fontSize: '0.9rem', color: sharedOnly ? 'white' : '#888' }}>Shared with me only</span>
                        <div style={{
                            width: '40px', height: '20px', background: sharedOnly ? 'var(--jager-orange)' : '#333',
                            borderRadius: '10px', position: 'relative', transition: 'all 0.3s'
                        }}>
                            <div style={{
                                width: '16px', height: '16px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px', left: sharedOnly ? '22px' : '2px', transition: 'all 0.3s'
                            }} />
                        </div>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="premium-button"
                    style={{ borderRadius: '16px' }}
                >
                    Done ({selectedBuddies.length})
                </button>
            </div>
        </div>
    );
}
