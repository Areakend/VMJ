import { useState, useEffect, useRef } from 'react'
import { Beer, MapPin, LogOut, Users, Target, Map as MapIcon, Download, Upload, Droplets, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { addDrink, subscribeToDrinks, deleteDrink, updateDrink } from './utils/storage'
import { getCurrentLocation } from './utils/location'
import { useAuth } from './contexts/AuthContext'
import { Capacitor } from '@capacitor/core'
import Login from './components/Login'
import UsernameSetup from './components/UsernameSetup'
import Friends from './components/Friends'
import DrinkMap from './components/DrinkMap'

function EditModal({ drink, onClose, onSave }) {
  const [volume, setVolume] = useState(drink.volume || 2);
  const [date, setDate] = useState(format(new Date(drink.timestamp), "yyyy-MM-dd'T'HH:mm"));

  const handleSave = () => {
    const newTimestamp = new Date(date).getTime();
    onSave(drink.id, { volume, timestamp: newTimestamp });
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
          {[2, 4, 8, 12, 70].map(v => (
            <button
              key={v}
              onClick={() => setVolume(v)}
              style={{
                background: volume === v ? '#fbb124' : '#333',
                color: volume === v ? 'black' : '#888',
                border: 'none', padding: '10px 0', borderRadius: '8px', fontWeight: 'bold',
                gridColumn: v === 70 ? 'span 4' : 'auto'
              }}
            >
              {v === 70 ? 'Bottle (70cl)' : v}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '8px' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: '#fbb124', border: 'none', color: 'black', borderRadius: '8px', fontWeight: 'bold' }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { currentUser, userData, loading: authLoading, logout } = useAuth();
  const [drinks, setDrinks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState('tracker'); // 'tracker', 'map', 'friends'
  const [volume, setVolume] = useState(2); // 2, 4, 8, 12
  const [locationState, setLocationState] = useState(null);
  const [editingDrink, setEditingDrink] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCurrentLocation().then(loc => setLocationState(loc)).catch(e => console.log("Silent loc fail", e));
  }, []);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToDrinks(currentUser.uid, (data) => {
        setDrinks(data);
      });
      return () => unsubscribe();
    } else {
      setDrinks([]);
    }
  }, [currentUser]);

  // Social Notification Listener
  useEffect(() => {
    if (!currentUser) return;

    const setupNotifications = async () => {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        try {
          const permission = await LocalNotifications.requestPermissions();
          if (permission.display !== 'granted') return;
        } catch (e) {
          console.warn("Notification permission error", e);
        }
      }

      const { subscribeToIncomingNotifications } = await import('./utils/storage');
      return subscribeToIncomingNotifications(currentUser.uid, async (notif) => {
        if (Capacitor.isNativePlatform()) {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          await LocalNotifications.schedule({
            notifications: [
              {
                title: "Nouveau Jäger ! 🦌",
                body: notif.message,
                id: Math.floor(Math.random() * 10000),
                schedule: { at: new Date(Date.now() + 100) }
              }
            ]
          });
        } else {
          console.log("Social Notification:", notif.message);
        }
      });
    };

    let unsubscribe;
    setupNotifications().then(unsub => unsubscribe = unsub);
    return () => unsubscribe && unsubscribe();
  }, [currentUser]);

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  if (!currentUser) return <Login />;
  if (!userData?.username) return <UsernameSetup />;

  const handleDrink = async () => {
    setLoading(true)
    setError(null)
    try {
      let location = null;
      try {
        location = await getCurrentLocation();
      } catch (locErr) {
        console.warn("Location fail", locErr);
      }

      const newDrink = {
        timestamp: Date.now(),
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        accuracy: location?.accuracy || null,
        locationName: null,
        volume: volume
      };

      await addDrink(currentUser.uid, newDrink, userData?.username || "Un ami");

    } catch (err) {
      console.error(err);
      setError("Failed. Try again.");
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDrink = async (drinkId, newData) => {
    try {
      await updateDrink(currentUser.uid, drinkId, newData);
      setEditingDrink(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update drink");
    }
  };

  // Export Data
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(drinks, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "jager_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  // Import Data
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let importedDrinks = JSON.parse(e.target.result);
        if (!Array.isArray(importedDrinks) && typeof importedDrinks === 'object' && importedDrinks !== null) {
          const possibleArray = Object.values(importedDrinks).find(val => Array.isArray(val));
          if (possibleArray) importedDrinks = possibleArray;
        }

        if (Array.isArray(importedDrinks)) {
          if (confirm(`Import ${importedDrinks.length} drinks?`)) {
            setLoading(true);
            let count = 0;
            for (const d of importedDrinks) {
              if (!d.timestamp && !d.date) continue;
              const dToSave = {
                timestamp: d.timestamp || new Date(d.date).getTime() || Date.now(),
                latitude: d.latitude || null,
                longitude: d.longitude || null,
                volume: d.volume || 2,
                importedAt: Date.now()
              };
              await addDrink(currentUser.uid, dToSave, userData?.username || "Un ami");
              count++;
            }
            setLoading(false);
            alert(`Added ${count} drinks.`);
          }
        } else {
          alert("Invalid JSON.");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  }

  // Stats
  const totalDrinks = drinks.length;
  const totalVolumeCl = drinks.reduce((acc, curr) => acc + (curr.volume || 2), 0);
  const currentYear = new Date().getFullYear();
  const drinksThisYear = drinks.filter(d => new Date(d.timestamp).getFullYear() === currentYear).length;

  return (
    <>
      <header>
        <h1>Jäger Tracker</h1>
        <div className="user-profile">
          <span className="user-name">{userData.username}</span>
          <button onClick={logout} className="logout-btn">
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-bar">
        <button
          onClick={() => setView('tracker')}
          className={`nav-item ${view === 'tracker' ? 'active' : ''}`}
        >
          <Target size={18} /> Tracker
        </button>
        <button
          onClick={() => setView('map')}
          className={`nav-item ${view === 'map' ? 'active' : ''}`}
        >
          <MapIcon size={18} /> Map
        </button>
        <button
          onClick={() => setView('friends')}
          className={`nav-item ${view === 'friends' ? 'active' : ''}`}
        >
          <Users size={18} /> Friends
        </button>
      </nav>

      {view === 'friends' ? (
        <Friends />
      ) : view === 'map' ? (
        <div className="map-view-container" style={{ height: "60vh", minHeight: "400px", width: "100%", display: 'flex' }}>
          <DrinkMap key={view} drinks={drinks} userLocation={locationState} />
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat-item">
              <strong>{totalDrinks}</strong>
              <span>Total Shots</span>
            </div>
            <div className="stat-item">
              <strong>{(totalVolumeCl / 100).toFixed(2)}L</strong>
              <span>Volume</span>
            </div>
            <div className="stat-item">
              <strong>{(totalVolumeCl / 70).toFixed(1)}</strong>
              <span>Bottles</span>
            </div>
          </div>

          {/* Volume Selection */}
          <div className="volume-container">
            {[2, 4, 8, 12, 70].map(v => (
              <button
                key={v}
                onClick={() => setVolume(v)}
                className={`volume-btn ${volume === v ? 'active' : ''}`}
                style={v === 70 ? { gridColumn: 'span 4', background: volume === v ? '#064e3b' : 'rgba(255,255,255,0.05)' } : {}}
              >
                <span>{v === 70 ? '1 Bottle' : `${v}cl`}</span>
                <small>{v === 2 ? 'Shot' : v === 4 ? 'Double' : v === 8 ? 'Huge' : v === 12 ? 'Dead' : '70cl'}</small>
              </button>
            ))}
          </div>

          <div className="main-action-area">
            <button
              className="drink-button"
              onClick={handleDrink}
              disabled={loading}
            >
              <Beer size={42} />
              <span className="label">{loading ? '...' : 'Cheers!'}</span>
            </button>
            {error && <div style={{ color: '#ef4444', marginTop: '10px', fontSize: '0.9rem' }}>{error}</div>}
          </div>

          <div className="history-container">
            <div className="history-header">Recent Activity</div>

            {drinks.length === 0 && (
              <p style={{ color: '#666', textAlign: 'center', margin: '2rem 0', fontStyle: 'italic' }}>
                No drinks tracked yet.<br />Time to fix that?
              </p>
            )}

            {drinks.slice(0, 10).map(drink => (
              <div key={drink.id} className="history-item">
                <div style={{ flex: 1 }}>
                  <div className="history-time">
                    {format(new Date(drink.timestamp), 'HH:mm')}
                    <span className="history-date"> {format(new Date(drink.timestamp), 'dd MMM')}</span>
                  </div>
                  <div className="history-meta">
                    <span className="tag">
                      <Droplets size={10} style={{ verticalAlign: -1, marginRight: 2 }} />
                      {drink.volume || 2}cl
                    </span>
                    {drink.latitude && (
                      <span style={{ fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center' }}>
                        <MapPin size={10} style={{ marginRight: 2 }} /> Map
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setEditingDrink(drink)}
                    className="delete-btn"
                    style={{ color: '#888' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteDrink(currentUser.uid, drink.id)}
                    className="delete-btn"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Import / Export */}
          <div className="utility-bar">
            <button onClick={handleExport} className="utility-btn">
              <Download size={14} /> Export
            </button>
            <button onClick={() => fileInputRef.current.click()} className="utility-btn">
              <Upload size={14} /> Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              style={{ display: 'none' }}
              accept=".json"
            />
          </div>
        </>
      )}

      {editingDrink && (
        <EditModal
          drink={editingDrink}
          onClose={() => setEditingDrink(null)}
          onSave={handleUpdateDrink}
        />
      )}
    </>
  )
}

export default App
