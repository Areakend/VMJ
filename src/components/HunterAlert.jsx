import { X, Droplets } from 'lucide-react';
import { useState, useEffect } from 'react';

const HUNTER_MESSAGES = [
    { emoji: '💧', text: "Easy there, hunter. Time for a glass of water!" },
    { emoji: '🦌', text: "The deer are watching you drink. Pace yourself, hunter." },
    { emoji: '🥤', text: "Hydration check! Water is also a drink, believe it or not." },
    { emoji: '🌊', text: "Your liver just asked for a water break. Oblige it, hunter." },
    { emoji: '🧊', text: "Ice cold water incoming. Your future self will thank you." },
    { emoji: '🫡', text: "Responsible hunter spotted. A water, perhaps?" },
    { emoji: '🏔️', text: "Even the Jägermeister stag drinks from the mountain stream." },
    { emoji: '💦', text: "Stay hydrated! Shots go down smoother with water in between." },
    { emoji: '🍺', text: "One for every shot: a glass of water is a hunter's best companion." },
    { emoji: '⚡', text: "Power move: drink a water right now. Your headache tomorrow will disappear." },
];

export default function HunterAlert({ drinkCount, onDismiss }) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState(null);
    const [animatingOut, setAnimatingOut] = useState(false);

    useEffect(() => {
        // Trigger every 3 drinks (3, 6, 9...)
        if (drinkCount > 0 && drinkCount % 3 === 0) {
            const randomMsg = HUNTER_MESSAGES[Math.floor(Math.random() * HUNTER_MESSAGES.length)];
            setMessage(randomMsg);
            setVisible(true);
            setAnimatingOut(false);

            // Auto-dismiss after 6 seconds
            const timer = setTimeout(() => handleDismiss(), 6000);
            return () => clearTimeout(timer);
        }
    }, [drinkCount]);

    const handleDismiss = () => {
        setAnimatingOut(true);
        setTimeout(() => {
            setVisible(false);
            setAnimatingOut(false);
            if (onDismiss) onDismiss();
        }, 300);
    };

    if (!visible || !message) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '90px',   // Above the nav bar
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2500,
                width: 'calc(100% - 2rem)',
                maxWidth: '380px',
                animation: animatingOut
                    ? 'slideDown 0.3s ease-in forwards'
                    : 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
        >
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.9); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
                }
                @keyframes slideDown {
                    from { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
                    to   { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.95); }
                }
                @keyframes drip {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(4px); }
                }
            `}</style>

            <div style={{
                background: 'linear-gradient(135deg, #1a2a2a 0%, #0d1f1f 100%)',
                border: '1px solid rgba(56, 189, 163, 0.4)',
                borderRadius: '20px',
                padding: '16px 20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 163, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                position: 'relative',
            }}>
                {/* Dripping drop icon */}
                <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #38bda3, #2a9d8f)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(56, 189, 163, 0.4)',
                    animation: 'drip 1.5s ease-in-out infinite',
                }}>
                    <Droplets size={22} color="white" />
                </div>

                {/* Message */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{message.emoji}</div>
                    <div style={{ fontSize: '0.85rem', color: '#e0f5f2', lineHeight: '1.4', fontWeight: '500' }}>
                        {message.text}
                    </div>
                </div>

                {/* Close */}
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'transparent', border: 'none',
                        color: '#4a7a74', cursor: 'pointer', padding: '4px',
                        flexShrink: 0,
                    }}
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
