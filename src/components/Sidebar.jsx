import { X, LogOut, CircleHelp, Info } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ isOpen, onClose, userData, onLogout, onShowHelp, totalDrinks }) {
    const [showAbout, setShowAbout] = useState(false);

    const menuItemStyle = {
        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid transparent', color: '#eee',
        fontSize: '1rem', fontWeight: '500', cursor: 'pointer',
        textAlign: 'left', width: '100%', borderRadius: '12px',
        marginBottom: '8px', transition: 'all 0.2s'
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
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{userData?.username}</h3>
                    <p style={{ margin: '5px 0 0', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}> {totalDrinks || 0} lifetime shots</p>
                </div>

                {/* Menu Items */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <button onClick={() => { onClose(); onShowHelp(); }} style={menuItemStyle}>
                        <CircleHelp size={20} color="var(--jager-orange)" /> App Guide
                    </button>

                    <button onClick={() => setShowAbout(!showAbout)} style={{ ...menuItemStyle, borderColor: showAbout ? 'var(--jager-orange)' : 'transparent' }}>
                        <Info size={20} color="var(--jager-orange)" /> About
                    </button>

                    <div style={{
                        overflow: 'hidden', transition: 'all 0.3s',
                        maxHeight: showAbout ? '500px' : '0', opacity: showAbout ? 1 : 0,
                        marginBottom: showAbout ? '10px' : '0'
                    }}>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.85rem', color: '#aaa', lineHeight: '1.5', border: '1px solid #333' }}>
                            <p style={{ margin: 0, marginBottom: '8px' }}><strong style={{ color: 'white' }}>Jäger Tracker</strong></p>
                            <p style={{ margin: 0 }}>This application is an independent fan project and has no affiliation with the beverage brand.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                    <button onClick={onLogout} style={{ ...menuItemStyle, color: '#ff4444', justifyContent: 'center', background: 'rgba(255, 0, 0, 0.05)' }}>
                        <LogOut size={20} /> Logout
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '1rem', color: '#444', fontSize: '0.7rem' }}>
                        v0.2.0 (Stable)
                    </div>
                </div>
            </div>
        </>
    );
}
