import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react';
import { format } from 'date-fns';
import { getDistanceFromLatLonInM } from '../utils/events';

// Neutral shot-glass pin (deliberately generic — no brand imagery, see
// src/config/branding.js for the trademark constraints)
const shotGlassSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.5"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Background Pin -->
    <circle cx="60" cy="60" r="54" fill="#1a1a1a" stroke="#fbbf24" stroke-width="4" />

    <!-- Shot glass -->
    <g stroke="#fbbf24" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M42 38 L48 86 L72 86 L78 38 Z" />
      <path d="M45 60 L75 60" />
    </g>
    <path d="M46.5 62 L48.5 84 L71.5 84 L73.5 62 Z" fill="#fbbf24" opacity="0.85" />
  </g>
</svg>`;

const drinkIcon = L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(shotGlassSvg)}`,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25]

});

// Event Icon (Green/Orange)
// Event Icon (Premium 3D SVG)
const eventSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#354e41" />
      <stop offset="100%" stop-color="#1a2e25" />
    </linearGradient>
    <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff" />
      <stop offset="100%" stop-color="#fbb124" />
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.4"/>
    </filter>
  </defs>
  
  <g filter="url(#shadow)">
    <!-- Pin Shape -->
    <path d="M50 2 C28 2 10 20 10 42 C10 70 50 98 50 98 C50 98 90 70 90 42 C90 20 72 2 50 2 Z" fill="url(#pinGrad)" stroke="#fbb124" stroke-width="2" />
    
    <!-- Inner Circle -->
    <circle cx="50" cy="42" r="28" fill="#151515" />
    
    <!-- Glowing Star -->
    <path d="M50 24 L56 38 L72 38 L59 48 L64 64 L50 54 L36 64 L41 48 L28 38 L44 38 Z" fill="url(#starGrad)" stroke="#fbb124" stroke-width="1.5" filter="url(#glow)" />
  </g>
</svg>`;

const eventIcon = L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(eventSvg)}`,
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -60]
});

function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        // Force resize again just in case
        setTimeout(() => map.invalidateSize(), 200);
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
}

export default function DrinkMap({ drinks, userLocation, publicEvents = [], showEvents = true, onSelectEvent }) {
    const defaultCenter = [48.8566, 2.3522];
    let center = defaultCenter;
    const lastDrink = drinks.find(d => d.latitude && d.longitude);

    if (lastDrink) {
        center = [lastDrink.latitude, lastDrink.longitude];
    } else if (userLocation?.latitude) {
        center = [userLocation.latitude, userLocation.longitude];
    }

    return (
        <div style={{ height: '100%', width: '100%', minHeight: '400px', position: 'relative' }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController center={center} />

                {drinks.map(drink => (
                    drink.latitude && drink.longitude ? (
                        <Marker
                            key={drink.id}
                            position={[drink.latitude, drink.longitude]}
                            icon={drinkIcon}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center' }}>
                                    <strong style={{ color: '#fbb124', display: 'block', fontSize: '1rem' }}>{drink.username || 'Buddy'}</strong>
                                    <div style={{ margin: '4px 0', fontSize: '0.85rem' }}>
                                        {format(new Date(drink.timestamp), 'dd MMM yyyy')}<br />
                                        {format(new Date(drink.timestamp), 'HH:mm')}
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: '#888' }}>{drink.volume || 2}cl</div>
                                    {drink.creatorId && drink.creatorId !== drink.userId && (
                                        <div style={{ fontSize: '0.7rem', color: '#666', fontStyle: 'italic', marginTop: '2px' }}>
                                            Tracked by {drink.creatorName || 'a buddy'}
                                        </div>
                                    )}
                                    {drink.buddies && drink.buddies.length > 0 && (
                                        <div style={{ fontSize: '0.7rem', color: '#fbb124', marginTop: '4px' }}>
                                            with {drink.buddies.map(b => b.username).join(', ')}
                                        </div>
                                    )}
                                    {drink.comment && (
                                        <div style={{ marginTop: '8px', fontStyle: 'italic', fontSize: '0.8rem', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                                            "{drink.comment}"
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ) : null
                ))}

                {/* Public Events Markers */}
                {publicEvents.map(event => {
                    if (!showEvents || !event.location) return null;
                    const distance = userLocation ? getDistanceFromLatLonInM(
                        userLocation.latitude, userLocation.longitude,
                        event.location.latitude, event.location.longitude
                    ) : Infinity;
                    const canJoin = distance <= 200; // 200 meters

                    return (
                        <Marker
                            key={event.id}
                            position={[event.location.latitude, event.location.longitude]}
                            icon={eventIcon}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                                    <strong style={{ color: '#fbbf24', fontSize: '1.1rem' }}>{event.title}</strong>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                                        {format(new Date(event.date), 'MMM d, h:mm a')}
                                    </div>
                                    <div style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
                                        {distance < 1000 ? `${Math.round(distance)}m away` : `${(distance / 1000).toFixed(1)}km away`}
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (canJoin) {
                                                // If already joined, just view. If not, auto-join logic could be here, 
                                                // but let's just go to details and let details handle "Join" or just auto-add if we want.
                                                // Actually, prompt here is nice.
                                                onSelectEvent(event.id);
                                            } else {
                                                alert("You need to be within 200m to join this event!");
                                            }
                                        }}
                                        style={{
                                            background: canJoin ? '#fbbf24' : '#444',
                                            color: canJoin ? 'black' : '#888',
                                            border: 'none', padding: '8px 16px', borderRadius: '12px',
                                            fontWeight: 'bold', width: '100%', cursor: canJoin ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        {canJoin ? "Check it out" : "Too far to join"}
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
