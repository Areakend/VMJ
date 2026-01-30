import React from 'react';
import { Filter, Check, X } from 'lucide-react';

export default function MapFilter({ friends, selectedUids, onToggle, currentUserId }) {
    const [isOpen, setIsOpen] = React.useState(false);

    const toggleAll = () => {
        const allUids = [currentUserId, ...friends.map(f => f.uid)];
        if (selectedUids.length === allUids.length) {
            onToggle([currentUserId]); // Keep only me
        } else {
            onToggle(allUids);
        }
    };

    const handleToggleFriend = (uid) => {
        if (selectedUids.includes(uid)) {
            // Don't allow deselecting current user if it's the only one? 
            // Actually, let's allow it, maybe they only want to see friends.
            onToggle(selectedUids.filter(id => id !== uid));
        } else {
            onToggle([...selectedUids, uid]);
        }
    };

    return (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbb124',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    cursor: 'pointer'
                }}
            >
                <Filter size={20} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '54px',
                    right: '0',
                    background: '#1c1c1c',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    width: '240px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>Show Activity from:</h4>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <button
                        onClick={toggleAll}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: '#2b2b2b',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fbb124',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {selectedUids.length > 1 ? 'Show Only Me' : 'Show All Crew'}
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                            onClick={() => handleToggleFriend(currentUserId)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px',
                                borderRadius: '8px',
                                background: selectedUids.includes(currentUserId) ? 'rgba(251, 177, 36, 0.1)' : 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                width: '18px',
                                height: '18px',
                                border: '1px solid #fbb124',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {selectedUids.includes(currentUserId) && <Check size={14} color="#fbb124" />}
                            </div>
                            <span style={{ fontSize: '0.9rem' }}>Me</span>
                        </div>

                        {friends.map(friend => (
                            <div
                                key={friend.uid}
                                onClick={() => handleToggleFriend(friend.uid)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: selectedUids.includes(friend.uid) ? 'rgba(251, 177, 36, 0.1)' : 'transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    border: '1px solid #fbb124',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {selectedUids.includes(friend.uid) && <Check size={14} color="#fbb124" />}
                                </div>
                                <span style={{ fontSize: '0.9rem' }}>{friend.username}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
