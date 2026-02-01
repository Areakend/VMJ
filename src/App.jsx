import { useState, useEffect, useRef } from 'react'
import { Beer, MapPin, LogOut, Users, Target, Map as MapIcon, Download, Upload, Droplets, Edit2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { addDrink, subscribeToDrinks, deleteDrink, updateDrink } from './utils/storage'
import { getCurrentLocation, getAddressFromCoords, getCoordsFromAddress } from './utils/location'
import { useAuth } from './contexts/AuthContext'
import { Capacitor } from '@capacitor/core'
import Login from './components/Login'
import UsernameSetup from './components/UsernameSetup'
import Friends from './components/Friends'
import DrinkMap from './components/DrinkMap'
import MapFilter from './components/MapFilter'
import EventsView from './components/EventsView'
import EventDetails from './components/EventDetails'
import { subscribeToFriends, saveFcmToken, sendFriendRequest, subscribeToRequests } from './utils/storage'
import { addEventDrink, subscribeToMyEvents } from './utils/events'
import { PushNotifications } from '@capacitor/push-notifications'
import { App as CapApp } from '@capacitor/app'

function EditModal({ drink, onClose, onSave }) {
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

function App() {
  const { currentUser, userData, loading: authLoading, logout } = useAuth();
  const [drinks, setDrinks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState('home'); // home, map, friends, events
  const [volume, setVolume] = useState(2); // 2, 4, 8, 12
  const [locationState, setLocationState] = useState(null);
  const [editingDrink, setEditingDrink] = useState(null);
  const [notifPermission, setNotifPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedMapUids, setSelectedMapUids] = useState([]);
  const [mapDrinks, setMapDrinks] = useState([]);
  const [drinkComment, setDrinkComment] = useState("");
  const [selectedBuddies, setSelectedBuddies] = useState([]); // Array of {uid, username}
  const [buddyFilter, setBuddyFilter] = useState(null); // UID of buddy to filter by in history
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const fileInputRef = useRef(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]); // Events where I am status='active'

  useEffect(() => {
    getCurrentLocation().then(loc => setLocationState(loc)).catch(e => console.log("Silent loc fail", e));
  }, []);

  // --- Subscriptions ---
  useEffect(() => {
    if (currentUser) {
      const unsubDrinks = subscribeToDrinks(currentUser.uid, setDrinks);
      const unsubFriends = subscribeToFriends(currentUser.uid, setFriends);
      // const unsubRequest = subscribeToRequests(currentUser.uid, setRequests);
      // const unsubEvents = subscribeToMyEvents(currentUser.uid, (events) => {
      //   // Check for active event
      //   const active = events.filter(e => {
      //     const me = e.participants?.find(p => p.uid === currentUser.uid);
      //     return me?.status === 'active';
      //   });
      //   setActiveEvents(active);
      // });

      saveFcmToken(currentUser.uid).then(token => {
        if (token && Capacitor.getPlatform() !== 'web') {
          saveFcmToken(currentUser.uid, token);
        }
      });

      return () => {
        unsubDrinks();
        unsubFriends();
        // unsubRequest();
        // unsubEvents();
      };
    }
  }, [currentUser]);

  // Initial selected UIDs
  useEffect(() => {
    if (currentUser && selectedMapUids.length === 0) {
      setSelectedMapUids([currentUser.uid]);
    }
  }, [currentUser]);

  // Fetch drinks for the map view
  useEffect(() => {
    if (!currentUser || view !== 'map' || selectedMapUids.length === 0) return;

    const unsubs = [];
    const collections = {}; // uid -> drinks[]

    selectedMapUids.forEach(uid => {
      const unsub = subscribeToDrinks(uid, (userDrinks) => {
        collections[uid] = userDrinks.map(d => ({
          ...d,
          userId: uid,
          username: uid === currentUser.uid ? userData.username : (friends.find(f => f.uid === uid)?.username || 'Buddy')
        }));

        // Combine all currently fetched
        const combined = Object.values(collections).flat();
        setMapDrinks(combined);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [view, selectedMapUids, currentUser, friends, userData]);

  // Social Notification Listener
  useEffect(() => {
    if (!currentUser) return;

    const setupNotifications = async () => {
      // --- Local Notifications (Social Banner) ---
      let currentPerm = 'granted';
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const status = await LocalNotifications.checkPermissions();
        currentPerm = status.display;
        setNotifPermission(currentPerm);
      } else {
        setNotifPermission('granted');
      }

      if (currentPerm === 'granted') {
        const { subscribeToIncomingNotifications } = await import('./utils/storage');
        const unsub = subscribeToIncomingNotifications(currentUser.uid, async (notif) => {
          if (Capacitor.isNativePlatform()) {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: "New Jäger! 🦌",
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
        return unsub;
      }
    };

    // --- Deep Link Handling ---
    useEffect(() => {
      CapApp.addListener('appUrlOpen', async (data) => {
        // Example: vitemonjager://add-friend?username=TheLegend
        if (data.url.includes('add-friend') && currentUser && userData?.username) {
          try {
            const url = new URL(data.url);
            const targetUsername = url.searchParams.get('username');

            if (targetUsername && targetUsername !== userData.username) {
              // SECURITY: Validate format before even showing the prompt
              // This prevents spamming with long strings or invalid characters
              const { validateUsername } = await import('./utils/storage');
              const validationError = validateUsername(targetUsername);

              if (validationError) {
                console.warn("Blocked invalid deep link username:", targetUsername);
                return;
              }

              const confirmAdd = confirm(`Add ${targetUsername} as a drinking buddy?`);
              if (confirmAdd) {
                try {
                  await sendFriendRequest(currentUser.uid, userData.username, targetUsername);
                  alert(`Friend request sent to ${targetUsername}!`);
                } catch (e) {
                  if (e.message === 'Already friends') {
                    alert(`You are already friends with ${targetUsername}!`);
                  } else {
                    alert(`Error adding friend: ${e.message}`);
                  }
                }
              }
            }
          } catch (err) {
            console.error('Deep link error:', err);
          }
        }
      });
    }, [currentUser, userData]);

    // --- Push Notifications ---
    const setupPush = async () => {
      if (!Capacitor.isNativePlatform()) return;

      let status = await PushNotifications.checkPermissions();
      if (status.receive === 'prompt') {
        status = await PushNotifications.requestPermissions();
      }

      if (status.receive === 'granted') {
        PushNotifications.register();

        PushNotifications.addListener('registration', (token) => {
          console.log("Push Registration Success:", token.value);
          saveFcmToken(currentUser.uid, token.value);
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error("Push Registration Error:", err);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log("Push Received:", notification);
        });
      }
    };

    let unsubLocal;
    setupNotifications().then(unsub => unsubLocal = unsub);
    setupPush();

    return () => {
      if (unsubLocal) unsubLocal();
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [currentUser]);

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  if (!currentUser) return <Login />;
  if (!userData?.username) return <UsernameSetup />;

  const handleDrink = async () => {
    setLoading(true)
    setError(null)
    try {
      let location = null;
      let addressName = null;
      try {
        location = await getCurrentLocation();
        if (location) {
          addressName = await getAddressFromCoords(location.latitude, location.longitude);
        }
      } catch (locErr) {
        console.warn("Location fail", locErr);
      }

      const newDrink = {
        timestamp: Date.now(),
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        accuracy: location?.accuracy || null,
        locationName: addressName || null,
        volume: volume,
        comment: drinkComment.trim() || null
      };

      await addDrink(currentUser.uid, newDrink, userData?.username || "A friend", selectedBuddies);
      setDrinkComment(""); // Reset comment
      setSelectedBuddies([]); // Reset buddies

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
          const limit = 100;
          const toImport = importedDrinks.slice(0, limit);

          if (confirm(`Import ${toImport.length} drinks?${importedDrinks.length > limit ? ` (Limited to first ${limit})` : ''}`)) {
            setLoading(true);
            let count = 0;
            for (const d of toImport) {
              if (!d.timestamp && !d.date) continue;
              const dToSave = {
                timestamp: Number(d.timestamp || new Date(d.date).getTime() || Date.now()),
                latitude: typeof d.latitude === 'number' ? d.latitude : null,
                longitude: typeof d.longitude === 'number' ? d.longitude : null,
                volume: typeof d.volume === 'number' ? d.volume : 2,
                comment: typeof d.comment === 'string' ? d.comment.slice(0, 100) : null,
                importedAt: Date.now()
              };
              // Add to event(s) if active
              if (activeEvents.length > 0) {
                // Add to the first active event (or all?)
                // "User can open or close it for himself" implies one active focus, or multiple.
                // Let's add to all active events to be safe/powerful.
                for (const ev of activeEvents) {
                  await addEventDrink(ev.id, currentUser.uid, userData.username, dToSave);
                }
              }

              await addDrink(currentUser.uid, dToSave, userData?.username || "A friend");
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

  // Filtering logic for the history list
  const filteredDrinks = drinks.filter(d => {
    const dDate = new Date(d.timestamp);
    const afterStart = !startDate || dDate >= new Date(startDate);
    const beforeEnd = !endDate || dDate <= new Date(endDate);
    const matchesBuddy = !buddyFilter || (d.buddies && d.buddies.some(b => b.uid === buddyFilter)) || (d.creatorId === buddyFilter);
    return afterStart && beforeEnd && matchesBuddy;
  });

  // Stats
  const totalDrinks = drinks.length;
  const totalVolumeCl = drinks.reduce((acc, curr) => acc + (curr.volume || 2), 0);

  // Shared Stats (when buddyFilter is active)
  const sharedStats = buddyFilter ? {
    shots: filteredDrinks.length,
    volume: filteredDrinks.reduce((acc, curr) => acc + (curr.volume || 2), 0)
  } : null;

  // Last Night (Midday to Midday)
  const getLastNightVolume = () => {
    const now = new Date();
    const middayToday = new Date(now);
    middayToday.setHours(12, 0, 0, 0);

    let start, end;
    if (now.getHours() >= 12) {
      start = middayToday.getTime();
      end = middayToday.getTime() + (24 * 60 * 60 * 1000);
    } else {
      start = middayToday.getTime() - (24 * 60 * 60 * 1000);
      end = middayToday.getTime();
    }

    return drinks
      .filter(d => d.timestamp >= start && d.timestamp < end)
      .reduce((acc, curr) => acc + (curr.volume || 2), 0);
  };

  const lastNightVolume = getLastNightVolume();


  /*
    return (
      <>
        <header>
        ...
        </header>
        ...
      </>
    )
  */
  return (
    <div style={{ padding: 50, color: 'fbb124', textAlign: 'center' }}>
      <h1>App Logic Loaded Correctly</h1>
      <p>Debug Step 2: Hooks are fine.</p>
    </div>
  );
}

export default App;
