import { useState } from 'react';
import { Search, X, Users, Check, Square } from 'lucide-react';

export default function CrewSelector({ friends, selectedBuddies, onToggle, onClose }) {
    const [search, setSearch] = useState('');

    const filteredFriends = friends.filter(f =>
        f.username.toLowerCase().includes(search.toLowerCase())
    );

    const isSelected = (uid) => selectedBuddies.some(b => b.uid === uid);

    const handleToggleAll = () => {
        if (selectedBuddies.length === friends.length) {
            onToggle([]); // Clear
        } else {
            onToggle(friends.map(f => ({ uid: f.uid, username: f.username })));
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
                        <Users size={20} /> Select Crew
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666' }}>
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
                            color: 'white', fontSize: '0.8rem', fontWeight: 'bold'
                        }}
                    >
                        {selectedBuddies.length === friends.length ? 'Clear All' : 'Select All'}
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '4px' }}>
                    {filteredFriends.map(friend => {
                        const active = isSelected(friend.uid);
                        return (
                            <div
                                key={friend.uid}
                                onClick={() => {
                                    if (active) {
                                        onToggle(selectedBuddies.filter(b => b.uid !== friend.uid));
                                    } else {
                                        onToggle([...selectedBuddies, { uid: friend.uid, username: friend.username }]);
                                    }
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px', borderRadius: '12px', background: active ? 'rgba(251, 177, 36, 0.1)' : 'transparent',
                                    cursor: 'pointer', border: '1px solid', borderColor: active ? '#fbb124' : 'transparent',
                                    marginBottom: '4px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%', background: '#444',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}>
                                        {friend.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ color: active ? 'white' : '#888' }}>{friend.username}</span>
                                </div>
                                {active ? <Check size={18} color="#fbb124" /> : <div style={{ width: 18, height: 18, border: '1px solid #444', borderRadius: '4px' }} />}
                            </div>
                        )
                    })}
                    {filteredFriends.length === 0 && <p style={{ textAlign: 'center', color: '#666', marginTop: '1rem' }}>No matching friends.</p>}
                </div>

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
