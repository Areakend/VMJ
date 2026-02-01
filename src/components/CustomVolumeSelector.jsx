import { useState, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown, Check } from 'lucide-react';

export default function CustomVolumeSelector({ volume, onSelect, onClose }) {
    const [tempVolume, setTempVolume] = useState(volume || 4);
    const scrollRef = useRef(null);

    // Handle touch/mouse dragging on the bottle to change volume
    const handleInteraction = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const relativeY = clientY - rect.top;
        const percentage = 1 - (relativeY / rect.height);

        // Map percentage to volume (e.g., 1 to 70cl)
        const maxVol = 70;
        let newVol = Math.round(percentage * maxVol);
        if (newVol < 1) newVol = 1;
        if (newVol > maxVol) newVol = maxVol;
        setTempVolume(newVol);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
            padding: '1.5rem', backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                background: '#1c1c1c', width: '100%', maxWidth: '340px',
                borderRadius: '32px', padding: '2rem', border: '1px solid #333',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--jager-orange)', fontSize: '1.2rem', fontWeight: '800' }}>CUSTOM VOLUME</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* The Virtual Bottle */}
                <div
                    onMouseDown={handleInteraction}
                    onMouseMove={(e) => e.buttons === 1 && handleInteraction(e)}
                    onTouchMove={handleInteraction}
                    style={{
                        width: '100px',
                        height: '240px',
                        background: '#0a0a0a',
                        border: '4px solid #2a2a2a',
                        borderRadius: '12px 12px 4px 4px',
                        position: 'relative',
                        cursor: 'ns-resize',
                        overflow: 'hidden',
                        marginBottom: '2rem',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,1)'
                    }}
                >
                    {/* Bottle Neck */}
                    <div style={{
                        position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)',
                        width: '30px', height: '15px', background: '#2a2a2a', borderRadius: '4px 4px 0 0'
                    }} />

                    {/* Liquid Fill */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        height: `${(tempVolume / 70) * 100}%`,
                        background: 'linear-gradient(to top, #354e41, #fbb124)',
                        transition: 'height 0.1s ease-out',
                        boxShadow: '0 -5px 15px rgba(251, 177, 36, 0.3)'
                    }}>
                        {/* Bubbles animation would be nice, but keeping it simple */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'white', opacity: 0.3
                        }} />
                    </div>

                    {/* Label inside bottle */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        textAlign: 'center', pointerEvents: 'none', width: '100%'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: tempVolume > 35 ? 'black' : 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {tempVolume}
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: tempVolume > 35 ? 'black' : 'white', opacity: 0.8 }}>
                            cl
                        </div>
                    </div>
                </div>

                {/* Fine Tuning Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setTempVolume(Math.max(1, tempVolume - 1))}
                        style={{ background: '#333', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <ChevronDown size={24} />
                    </button>

                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', width: '60px', textAlign: 'center' }}>
                        {tempVolume}cl
                    </div>

                    <button
                        onClick={() => setTempVolume(Math.min(70, tempVolume + 1))}
                        style={{ background: '#333', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <ChevronUp size={24} />
                    </button>
                </div>

                <button
                    onClick={() => {
                        onSelect(tempVolume);
                        onClose();
                    }}
                    className="premium-button"
                    style={{ borderRadius: '20px', padding: '16px' }}
                >
                    Confirm Volume <Check size={20} />
                </button>
            </div>
        </div>
    );
}
