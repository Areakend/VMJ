import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getDistanceFromLatLonInM, inviteToEvent } from '../utils/events';
import { Capacitor } from '@capacitor/core';

// Robust SVG Icon as Data URL - High Contrast Version
const stagSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.5"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Background Pin -->
    <circle cx="60" cy="60" r="54" fill="#1a1a1a" stroke="#fbbf24" stroke-width="4" />
    
    <!-- Stag Head (Centered and Scaled) -->
    <g transform="translate(10, 10)">
        <path d="M50 80 L42 60 Q42 52 50 52 Q58 52 58 60 L50 80" fill="#fbbf24" stroke="none" />
        <path d="M44 58 Q30 48 22 58" stroke="#fbbf24" fill="none" stroke-width="5" stroke-linecap="round" />
        <path d="M42 54 Q25 35 15 45" stroke="#fbbf24" fill="none" stroke-width="5" stroke-linecap="round" />
        <path d="M40 50 Q20 25 10 35" stroke="#fbbf24" fill="none" stroke-width="5" stroke-linecap="round" />
        <path d="M56 58 Q70 48 78 58" stroke="#fbbf24" fill="none" stroke-width="5" stroke-linecap="round" />
        <path d="M58 54 Q75 35 85 45" stroke="#fbbf24" fill="none" stroke-width="5" stroke-linecap="round" />
        <path d="M60 50 Q80 25 90 35" stroke="#fbbf24" fill="none" stroke-width="5" stroke-linecap="round" />
        <path d="M50 42 V20 M42 30 H58" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
    </g>
  </g>
</svg>`;

const iconUrl = `data:image/svg+xml;base64,${btoa(stagSvg)}`;

const stagIcon = L.icon({
    iconUrl: iconUrl,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25]

});

// Event Icon (Green/Orange)
// Event Icon (Custom Image)
const eventIcon = L.icon({
    iconUrl: '/event-pin.png',
    iconSize: [60, 60], // Larger for the nice 3D effect
    iconAnchor: [30, 60], // Bottom center anchor roughly
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
                            icon={stagIcon}
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
