import { useState, useEffect, useRef } from 'react';
import { X, Trophy, Dices } from 'lucide-react';
import confetti from 'canvas-confetti'; // We'll try to use this if available, or just CSS fallback

export default function JagerRoulette({ participants, onClose }) {
    const [currentName, setCurrentName] = useState("READY?");
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const [speed, setSpeed] = useState(50); // Initial delay in ms

    const timeoutRef = useRef(null);

    const handleSpin = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        setWinner(null);
        setSpeed(50);

        // Filter valid participants (exclude guests if needed, or just use all names)
        const names = participants.map(p => p.username);

        if (names.length < 2) {
            alert("Need at least 2 people to play!");
            setIsSpinning(false);
            return;
        }

        let currentSpeed = 50;
        let steps = 0;
        const totalSteps = 30 + Math.floor(Math.random() * 20); // Random duration

        const spinLoop = () => {
            // Pick random name
            const randomIndex = Math.floor(Math.random() * names.length);
            setCurrentName(names[randomIndex]);

            steps++;

            if (steps < totalSteps) {
                // Acceleration curve (slow down at the end)
                if (steps > totalSteps - 10) {
                    currentSpeed += 30; // Slow down drastically
                } else {
                    currentSpeed += 2; // Slow down slightly
                }
                timeoutRef.current = setTimeout(spinLoop, currentSpeed);
            } else {
                // FINISHED
                const finalWinner = names[randomIndex];
                setWinner(finalWinner);
                setIsSpinning(false);

                // Fire confetti!
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#fbb124', '#5614b0', '#ffffff']
                });

                // Trigger simple vibration if on mobile
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        };

        spinLoop();
    };

    // Cleanup
    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 1000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)'
        }}>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute', top: 'calc(20px + env(safe-area-inset-top))', right: 20,
                    background: 'none', border: 'none', color: 'white', cursor: 'pointer'
                }}
            >
                <X size={32} />
            </button>

            {!winner ? (
                <>
                    <div style={{
                        fontSize: '3rem', fontWeight: '900', color: 'var(--jager-orange)',
                        textAlign: 'center', marginBottom: '3rem',
                        textShadow: '0 0 20px rgba(251, 177, 36, 0.5)',
                        minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: isSpinning ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.1s'
                    }}>
                        {currentName}
                    </div>

                    {!isSpinning && (
                        <button
                            onClick={handleSpin}
                            className="premium-button"
                            style={{ width: 'auto', padding: '20px 40px', fontSize: '1.5rem' }}
                        >
                            <Dices size={32} /> SPIN!
                        </button>
                    )}
                </>
            ) : (
                <div className="roulette-winner-container" style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                    <div style={{ fontSize: '1.5rem', color: '#888', marginBottom: '1rem' }}>THE CHOSEN ONE</div>
                    <div style={{
                        fontSize: '4rem', fontWeight: '900', color: '#fff',
                        marginBottom: '2rem', textShadow: '0 0 30px var(--jager-green)',
                        animation: 'pulse 1s infinite'
                    }}>
                        {winner}
                    </div>
                    <div style={{ fontSize: '2rem', marginBottom: '3rem' }}>
                        🥃 Take a Shot!
                    </div>

                    <button
                        onClick={() => { setWinner(null); setCurrentName("READY?"); }}
                        style={{
                            background: '#333', color: 'white', border: 'none',
                            padding: '12px 24px', borderRadius: '12px', fontSize: '1.2rem'
                        }}
                    >
                        Play Again
                    </button>
                </div>
            )}
        </div>
    );
}
