import { X, LogOut, CircleHelp, Info, FileText, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen, onClose, userData, onLogout, onShowHelp, totalDrinks }) {
    const [showAbout, setShowAbout] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [editError, setEditError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { updateUsername, deleteAccount } = useAuth();

    const menuItemStyle = {
        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid transparent', color: '#eee',
        fontSize: '1rem', fontWeight: '500', cursor: 'pointer',
        textAlign: 'left', width: '100%', borderRadius: '12px',
        marginBottom: '8px', transition: 'all 0.2s'
    };

    const changelogItems = [
        { v: '0.3.1', date: '2026-02-05', changes: ['Social Feed with Reactions & Comments', 'Notification Deep Linking', 'Keyboard visibility navigation toggle', 'UI polish & rounded buttons'] },
        { v: '0.2.0', date: '2026-02-01', changes: ['Crew Selector filtering', 'Custom Volume Bottle UI', 'Event system live', 'Android App Links support'] }
    ];

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) return;
        setEditError(null);
        try {
            await updateUsername(newUsername.trim());
            setIsEditingName(false);
        } catch (error) {
            setEditError(error.message);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount();
            onClose();
        } catch (error) {
            alert("Failed to delete account: " + error.message);
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    zIndex: 2500, pointerEvents: isOpen ? 'auto' : 'none',
                    opacity: isOpen ? 1 : 0, transition: 'opacity 0.3s',
                    backdropFilter: 'blur(2px)'
                }}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px',
                background: '#151515', borderLeft: '1px solid #333', zIndex: 2501,
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--jager-orange)' }}>Profile</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Profile Info */}
                <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #354e41 0%, #1a2e25 100%)',
                        margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--jager-orange)', border: '2px solid var(--jager-orange)',
                        boxShadow: '0 0 20px rgba(53, 78, 65, 0.5)'
                    }}>
                        {userData?.username?.charAt(0).toUpperCase()}
                    </div>

                    {!isEditingName ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{userData?.username}</h3>
                            <button
                                onClick={() => { setIsEditingName(true); setNewUsername(userData?.username || ''); setEditError(null); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }}
                                title="Edit username"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="New username"
                                maxLength={15}
                                style={{
                                    background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: 'white',
                                    padding: '8px', borderRadius: '8px', textAlign: 'center', width: '100%'
                                }}
                            />
                            {editError && <span style={{ color: '#ff4444', fontSize: '0.7rem' }}>{editError}</span>}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => { setIsEditingName(false); setEditError(null); }}
                                    style={{ padding: '6px 12px', borderRadius: '6px', background: '#333', border: 'none', color: '#aaa', cursor: 'pointer' }}
                                >Cancel</button>
                                <button
                                    onClick={handleUpdateUsername}
                                    style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--jager-orange)', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                                >Save</button>
                            </div>
                        </div>
                    )}

                    <p style={{ margin: '5px 0 0', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}> {totalDrinks || 0} lifetime shots</p>
                </div>

                {/* Menu Items */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                    <button onClick={() => { onClose(); onShowHelp(); }} style={menuItemStyle}>
                        <CircleHelp size={20} color="var(--jager-orange)" /> App Guide
                    </button>

                    <button onClick={() => { setShowAbout(!showAbout); if (!showAbout) setShowChangelog(false); }} style={{ ...menuItemStyle, borderColor: showAbout ? 'var(--jager-orange)' : 'transparent', marginBottom: showAbout ? '4px' : '8px' }}>
                        <Info size={20} color="var(--jager-orange)" /> About
                    </button>

                    {showAbout && (
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.85rem', color: '#aaa', lineHeight: '1.5', border: '1px solid #333', marginBottom: '12px' }}>
                            <p style={{ margin: 0, marginBottom: '8px' }}><strong style={{ color: 'white' }}>Jäger Tracker</strong></p>
                            <p style={{ margin: 0 }}>This application is an independent fan project and has no affiliation with the beverage brand.</p>
                        </div>
                    )}

                    <button onClick={() => { setShowChangelog(!showChangelog); if (!showChangelog) setShowAbout(false); }} style={{ ...menuItemStyle, borderColor: showChangelog ? 'var(--jager-orange)' : 'transparent', marginBottom: showChangelog ? '4px' : '8px' }}>
                        <FileText size={20} color="var(--jager-orange)" /> Changelog
                    </button>

                    {showChangelog && (
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.8rem', color: '#aaa', lineHeight: '1.4', border: '1px solid #333', marginBottom: '12px' }}>
                            {changelogItems.map((item, id) => (
                                <div key={id} style={{ marginBottom: id !== changelogItems.length - 1 ? '16px' : 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <strong style={{ color: 'var(--jager-orange)' }}>v{item.v}</strong>
                                        <span style={{ fontSize: '0.7rem', color: '#666' }}>{item.date}</span>
                                    </div>
                                    <ul style={{ paddingLeft: '16px', margin: 0 }}>
                                        {item.changes.map((c, idx) => <li key={idx}>{c}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem', marginTop: 'auto' }}>
                    <button onClick={onLogout} style={{ ...menuItemStyle, color: '#ff4444', justifyContent: 'center', background: 'rgba(255, 0, 0, 0.05)' }}>
                        <LogOut size={20} /> Logout
                    </button>

                    {!isDeleting ? (
                        <button
                            onClick={() => setIsDeleting(true)}
                            style={{ width: '100%', marginTop: '8px', background: 'none', border: 'none', color: '#666', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Delete Account
                        </button>
                    ) : (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.3)' }}>
                            <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0 0 8px 0', textAlign: 'center' }}>Are you sure? This is permanent.</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setIsDeleting(false)} style={{ flex: 1, padding: '4px', background: '#333', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                                <button onClick={handleDeleteAccount} style={{ flex: 1, padding: '4px', background: '#ff4444', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Confirm</button>
                            </div>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '1rem', color: '#444', fontSize: '0.7rem' }}>
                        v0.3.1 (Social Update)
                    </div>
                </div>
            </div>
        </>
    );
}
