import { HEALTH_WARNING_FR, HEALTH_WARNING_EN } from '../config/branding';

// Statutory health warning (loi Évin). Keep it visible and legible wherever
// the app talks about alcohol — do not hide it behind interactions.
export default function HealthWarning({ style = {} }) {
    return (
        <div style={{
            fontSize: '0.7rem',
            color: '#999',
            textAlign: 'center',
            lineHeight: 1.5,
            padding: '8px 12px',
            ...style
        }}>
            <div>{HEALTH_WARNING_FR}</div>
            <div style={{ opacity: 0.8 }}>{HEALTH_WARNING_EN}</div>
        </div>
    );
}
