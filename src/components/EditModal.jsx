import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getAddressFromCoords, getCoordsFromAddress } from '../utils/location';

export default function EditModal({ drink, onClose, onSave }) {
    const [volume, setVolume] = useState(drink.volume || 2);
    const [date, setDate] = useState(format(new Date(drink.timestamp), "yyyy-MM-dd'T'HH:mm"));
    const [comment, setComment] = useState(drink.comment || "");
    const [address, setAddress] = useState(drink.locationName || "");
    const [lat, setLat] = useState(drink.latitude || "");
    const [lng, setLng] = useState(drink.longitude || "");
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        if (!drink.locationName && drink.latitude && drink.longitude) {
            getAddressFromCoords(drink.latitude, drink.longitude).then(addr => {
                if (addr) setAddress(addr);
            });
        }
    }, [drink]);

    const handleLookup = async () => {
        if (!address) return;
        setResolving(true);
        const coords = await getCoordsFromAddress(address);
        if (coords) {
            setLat(coords.latitude);
            setLng(coords.longitude);
            setAddress(coords.displayName);
            alert("Location found!");
        } else {
            alert("Could not find this address.");
        }
        setResolving(false);
    };

    const handleSave = () => {
        const newTimestamp = new Date(date).getTime();
        onSave(drink.id, {
            volume,
            comment,
            timestamp: newTimestamp,
            locationName: address,
            latitude: lat === "" ? null : parseFloat(lat),
            longitude: lng === "" ? null : parseFloat(lng)
        });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: '#1c1c1c', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '320px',
                border: '1px solid #333'
            }}>
                <h3 style={{ marginTop: 0, color: '#fbb124' }}>Edit Drink</h3>

                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem' }}>Time</label>
                <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                        background: '#333', color: 'white', border: 'none', padding: '10px', borderRadius: '8px',
                        width: '100%', marginBottom: '1.5rem', fontSize: '1rem'
                    }}
                />

                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem' }}>Volume (cl)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '2rem' }}>
                    {[2, 4, 8, 12].map(v => (
                        <button
                            key={v}
                            onClick={() => setVolume(v)}
                            style={{
                                background: volume === v ? '#fbb124' : '#333',
                                color: volume === v ? 'black' : '#888',
                                border: 'none', padding: '10px 0', borderRadius: '8px', fontWeight: 'bold'
                            }}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem' }}>Comment</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What was the occasion?"
                    style={{
                        background: '#333', color: 'white', border: 'none', padding: '10px', borderRadius: '8px',
                        width: '100%', minHeight: '60px', marginBottom: '1.5rem', fontSize: '1rem', resize: 'none'
                    }}
                />

                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem' }}>Location (Address)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Search address..."
                        style={{
                            background: '#333', color: 'white', border: 'none', padding: '10px', borderRadius: '8px',
                            flex: 1, fontSize: '0.9rem'
                        }}
                    />
                    <button
                        onClick={handleLookup}
                        disabled={resolving}
                        style={{
                            background: '#444', color: '#fbb124', border: 'none', padding: '0 12px', borderRadius: '8px',
                            fontSize: '0.8rem', fontWeight: 'bold'
                        }}
                    >
                        {resolving ? '...' : 'Find'}
                    </button>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '1.5rem', paddingLeft: '5px' }}>
                    {lat ? `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'No coordinates set'}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '8px' }}>Cancel</button>
                    <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: '#fbb124', border: 'none', color: 'black', borderRadius: '8px', fontWeight: 'bold' }}>Save</button>
                </div>
            </div>
        </div>
    );
}
