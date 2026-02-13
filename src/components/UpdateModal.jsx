import { X, Download, Clock, AlertCircle } from 'lucide-react';
import { skipVersion } from '../utils/versionChecker';
import { useState } from 'react';

export default function UpdateModal({ release, onClose }) {
    const [loading, setLoading] = useState(false);

    const handleSkipVersion = () => {
        skipVersion(release.version);
        onClose();
    };

    const handleDownload = () => {
        setLoading(true);
        window.open(release.url, '_blank');
        setTimeout(() => {
            setLoading(false);
            onClose();
        }, 1000);
    };

    // Parse release notes (simple markdown to HTML)
    const formatReleaseNotes = (body) => {
        if (!body) return '';
        return body
            .split('\n')
            .map(line => {
                if (line.startsWith('## ')) {
                    return `<h3 style="color: var(--jager-orange); margin: 1rem 0 0.5rem 0; font-size: 1.1rem;">${line.slice(3)}</h3>`;
                } else if (line.startsWith('- ')) {
                    return `<li style="margin-left: 1.5rem; margin-bottom: 0.3rem;">${line.slice(2)}</li>`;
                } else if (line.trim() === '') {
                    return '<br/>';
                } else {
                    return `<p style="margin: 0.5rem 0;">${line}</p>`;
                }
            })
            .join('');
    };

    return (
        <>
            {/* Overlay */}
            <div
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', padding: '1rem'
                }}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    zIndex: 3001, background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
                    borderRadius: '24px', padding: '2rem', maxWidth: '500px', width: '90%',
                    border: '2px solid var(--jager-orange)', boxShadow: '0 20px 60px rgba(251, 177, 36, 0.3)',
                    maxHeight: '80vh', overflowY: 'auto'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <AlertCircle size={24} color="var(--jager-orange)" />
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--jager-orange)' }}>Update Available</h2>
                        </div>
                        <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
                            {release.name || `Version ${release.version}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Release Notes */}
                <div
                    style={{
                        background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem',
                        marginBottom: '1.5rem', color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6',
                        maxHeight: '300px', overflowY: 'auto'
                    }}
                    dangerouslySetInnerHTML={{ __html: formatReleaseNotes(release.body) }}
                />

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={handleDownload}
                        disabled={loading}
                        style={{
                            width: '100%', background: 'linear-gradient(135deg, var(--jager-orange), #ff9f1a)',
                            color: 'black', border: 'none', padding: '14px', borderRadius: '16px',
                            fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: '0 4px 15px rgba(251, 177, 36, 0.3)',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        <Download size={20} />
                        {loading ? 'Opening...' : 'Download Update'}
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #444',
                            color: 'white', padding: '12px', borderRadius: '12px',
                            fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <Clock size={18} />
                        Remind Me Later
                    </button>

                    <button
                        onClick={handleSkipVersion}
                        style={{
                            width: '100%', background: 'transparent', border: 'none',
                            color: '#666', padding: '8px', fontSize: '0.8rem', cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Skip This Version
                    </button>
                </div>
            </div>
        </>
    );
}
