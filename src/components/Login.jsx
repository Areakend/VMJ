import { useAuth } from '../contexts/AuthContext';
import { Beer } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '2rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, var(--jager-orange), #d99a1f)',
                padding: '1.5rem',
                borderRadius: '50%',
                boxShadow: '0 0 30px rgba(251, 177, 36, 0.2)'
            }}>
                <Beer size={64} color="#1a1a1a" />
            </div>

            <div style={{ textAlign: 'center' }}>
                <h1 style={{ marginBottom: '0.2rem', fontSize: '2.5rem' }}>Jäger Tracker</h1>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '2rem' }}>Track your shots across the crew.</p>
                <div style={{
                    fontSize: '0.65rem', color: '#444',
                    letterSpacing: '2px', fontWeight: 'bold'
                }}>
                    STABLE v0.3.2
                </div>
            </div>

            <button
                onClick={login}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'white',
                    color: '#1f1f1f',
                    padding: '14px 28px',
                    borderRadius: '30px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(255,255,255,0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.1)';
                }}
            >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" />
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
                Sign in with Google
            </button>
        </div>
    );
}
