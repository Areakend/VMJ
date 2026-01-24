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

            <div>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Jäger Tracker</h1>
                <p style={{ color: '#888' }}>Track your shots across devices.</p>
            </div>

            <button
                onClick={login}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: 'white',
                    color: 'black',
                    padding: '12px 24px',
                    marginTop: '1rem'
                }}
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="Google" />
                Sign in with Google
            </button>
        </div>
    );
}
