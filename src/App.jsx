import { useState, useEffect, useRef } from 'react'
import { MapPin, Users, Target, Map as MapIcon, Calendar, Check, User, Rss, ChevronRight, X } from 'lucide-react'
import { Keyboard } from '@capacitor/keyboard'
import Sidebar from './components/Sidebar';
import { format } from 'date-fns'
import { addDrink, subscribeToDrinks, deleteDrink, updateDrink } from './utils/storage'
import { getCurrentLocation, getAddressFromCoords, getCoordsFromAddress } from './utils/location'
import { useAuth } from './contexts/AuthContext'
import { Capacitor } from '@capacitor/core'
import Login from './components/Login'
import UsernameSetup from './components/UsernameSetup'
import Friends from './components/Friends'
import AppMapView from './components/AppMapView'
import EventsView from './components/EventsView'
import EventDetails from './components/EventDetails'
import TrackerView from './components/TrackerView'
import CrewSelector from './components/CrewSelector'
import FriendsFeed from './components/FriendsFeed'
import { subscribeToFriends, saveFcmToken, sendFriendRequest } from './utils/storage'
import { addEventDrink, subscribeToMyEvents, subscribeToPublicEvents } from './utils/events'
import { PushNotifications } from '@capacitor/push-notifications'
import { App as CapApp } from '@capacitor/app'


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
  const [selectedMapFilterBuddies, setSelectedMapFilterBuddies] = useState([]); // Array of {uid, username}
  const [mapSharedOnly, setMapSharedOnly] = useState(false);
  const [mapShowEvents, setMapShowEvents] = useState(true);
  const [mapDrinks, setMapDrinks] = useState([]);
  const [drinkComment, setDrinkComment] = useState("");
  const [selectedBuddies, setSelectedBuddies] = useState([]); // Array of {uid, username}
  const [selectedFilterBuddies, setSelectedFilterBuddies] = useState([]); // Array of {uid, username} for history filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const fileInputRef = useRef(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]); // Events where I am status='active'
  const [publicEvents, setPublicEvents] = useState([]); // All open public events
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showMainHelp, setShowMainHelp] = useState(false);
  const [showActivityFilterModal, setShowActivityFilterModal] = useState(false);
  const [showMapFilterModal, setShowMapFilterModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [targetDrinkId, setTargetDrinkId] = useState(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    getCurrentLocation().then(loc => setLocationState(loc)).catch(e => console.warn("Silent loc fail", e));
  }, []);

  // --- Subscriptions ---
  useEffect(() => {
    if (currentUser) {
      const unsubDrinks = subscribeToDrinks(currentUser.uid, setDrinks);
      const unsubFriends = subscribeToFriends(currentUser.uid, setFriends);
      const unsubEvents = subscribeToMyEvents(currentUser.uid, (events) => {
        // Check for active event
        const active = events.filter(e => {
          const me = e.participants?.find(p => p.uid === currentUser.uid);
          return me?.status === 'active';
        });
        setActiveEvents(active);
      });
      const unsubPublic = subscribeToPublicEvents((events) => {
        setPublicEvents(events);
      });

      saveFcmToken(currentUser.uid).then(token => {
        if (token && Capacitor.getPlatform() !== 'web') {
          saveFcmToken(currentUser.uid, token);
        }
      });

      return () => {
        unsubDrinks();
        unsubFriends();
        unsubEvents();
        unsubPublic();
      };
    }
  }, [currentUser]);

  // Initial selected UIDs for Map
  useEffect(() => {
    if (currentUser && userData?.username && selectedMapFilterBuddies.length === 0) {
      setSelectedMapFilterBuddies([{ uid: currentUser.uid, username: userData.username }]);
    }
  }, [currentUser, userData]);

  // Fetch drinks for the map view
  useEffect(() => {
    if (!currentUser || view !== 'map' || selectedMapFilterBuddies.length === 0) return;

    const unsubs = [];
    const collections = {}; // uid -> drinks[]

    selectedMapFilterBuddies.forEach(buddy => {
      const unsub = subscribeToDrinks(buddy.uid, (userDrinks) => {
        collections[buddy.uid] = userDrinks.map(d => ({
          ...d,
          userId: buddy.uid,
          username: buddy.username
        }));

        // Combine all currently fetched
        const combined = Object.values(collections).flat();
        setMapDrinks(combined);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [view, selectedMapFilterBuddies, currentUser]);

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
                  schedule: { at: new Date(Date.now() + 100) },
                  extra: { drinkId: notif.drinkId }
                }
              ]
            });
          } else {
            // Web notification (optional, maybe toast?)
          }
        });

        // Handle Local Notification Click
        if (Capacitor.isNativePlatform()) {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
            const drinkId = notification.notification.extra?.drinkId;
            if (drinkId) {
              setTargetDrinkId(drinkId);
              setView('feed');
            }
          });
        }

        return unsub;
      }
    };

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
          saveFcmToken(currentUser.uid, token.value);
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error("Push Registration Error:", err);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
        });

        // Handle notification tap - deep link to feed
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          const data = notification.notification.data;
          if (data?.drinkId) {
            setTargetDrinkId(data.drinkId);
            setView('feed');
          }
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

  // --- Deep Link Handling ---
  useEffect(() => {
    if (!currentUser) return;

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

      // vitemonjager://event?id=...
      if (data.url.includes('event') && currentUser) {
        try {
          const url = new URL(data.url);
          const eventIdForLink = url.searchParams.get('id');
          if (eventIdForLink) {
            const confirmJoin = confirm("Join this Jäger event?");
            if (confirmJoin) {
              const { inviteToEvent } = await import('./utils/events');
              await inviteToEvent(eventIdForLink, currentUser.uid, userData.username);
              setSelectedEventId(eventIdForLink);
              setView('events');
              alert("Joined event!");
            }
          }
        } catch (e) {
          console.error("Event deep link fail", e);
        }
      }
    });

    return () => {
      CapApp.removeAllListeners('appUrlOpen');
    };
  }, [currentUser, userData]);

  // --- Keyboard Visibility ---
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const showListener = Keyboard.addListener('keyboardWillShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // --- Browser URL Parameter Handling ---
  useEffect(() => {
    if (!currentUser || !userData?.username) return;

    const handleWebLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const targetUsername = params.get('username');
      const eventIdForLink = params.get('id');
      const path = window.location.pathname;

      // Handle path-based links if they occur (e.g. /event?id=...)
      let effectiveEventId = eventIdForLink;
      if (!effectiveEventId && path.includes('/event')) {
        effectiveEventId = params.get('id'); // Still check params
      }

      // Try to trigger the native app if we are on mobile web
      if ((targetUsername || effectiveEventId) && !Capacitor.isNativePlatform()) {
        const appScheme = targetUsername
          ? `vitemonjager://add-friend?username=${targetUsername}`
          : `vitemonjager://event?id=${effectiveEventId}`;

        // Silent attempt to open the app
        window.location.href = appScheme;

        // If we stay here, it means the app isn't installed or didn't trigger, 
        // we continue with the web handling below.
      }

      if (targetUsername && targetUsername !== userData.username) {
        const { validateUsername } = await import('./utils/storage');
        const error = validateUsername(targetUsername);
        if (error) {
          console.warn("Invalid username in link:", targetUsername);
        } else {
          const confirmAdd = confirm(`Add ${targetUsername} as a drinking buddy?`);
          if (confirmAdd) {
            try {
              await sendFriendRequest(currentUser.uid, userData.username, targetUsername);
              alert(`Friend request sent to ${targetUsername}!`);
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
              alert(e.message === 'Already friends' ? `Already friends with ${targetUsername}` : `Error: ${e.message}`);
            }
          }
        }
      }

      if (effectiveEventId && effectiveEventId.length >= 10 && effectiveEventId.length <= 50) {
        const confirmJoin = confirm("Join this Jäger event?");
        if (confirmJoin) {
          const { inviteToEvent } = await import('./utils/events');
          await inviteToEvent(effectiveEventId, currentUser.uid, userData.username);
          setSelectedEventId(effectiveEventId);
          setView('events');
          alert("Joined event!");
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleWebLink();
  }, [currentUser, userData]);

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

      const activeEventIds = activeEvents.map(ev => ev.id);
      const newDrink = {
        timestamp: Date.now(),
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        accuracy: location?.accuracy || null,
        locationName: addressName || null,
        volume: volume,
        comment: drinkComment.trim() || null,
        eventIds: activeEventIds
      };

      await addDrink(currentUser.uid, newDrink, userData?.username || "A friend", selectedBuddies);

      // --- Sync to active events ---
      if (activeEvents.length > 0) {
        for (const ev of activeEvents) {
          // Skip if event is globally closed
          if (ev.status === 'closed') continue;

          try {
            // 1. Add my shot to event
            await addEventDrink(ev.id, currentUser.uid, userData.username, newDrink);

            // 2. Add tagged buddies' shots to event if they are participants
            if (selectedBuddies.length > 0) {
              for (const buddy of selectedBuddies) {
                const isBuddyInEvent = ev.participants?.some(p => p.uid === buddy.uid);
                if (isBuddyInEvent) {
                  await addEventDrink(ev.id, buddy.uid, buddy.username, newDrink);
                }
              }
            }
          } catch (evErr) {
            console.warn("Field to add to event", ev.id, evErr);
          }
        }
      }

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

  const handleDeleteDrink = async (drink) => {
    if (!window.confirm("Delete this shot?")) return;
    try {
      await deleteDrink(currentUser.uid, drink.id);

      // Sync with events
      if (drink.eventIds && drink.eventIds.length > 0) {
        const { removeEventDrink } = await import('./utils/events'); // Dynamically import if not already at top
        for (const eventId of drink.eventIds) {
          try {
            await removeEventDrink(eventId, currentUser.uid, drink.timestamp);

            // Also remove buddies' tagged shots if any
            if (drink.buddies && drink.buddies.length > 0) {
              for (const buddy of drink.buddies) {
                await removeEventDrink(eventId, buddy.uid, drink.timestamp);
              }
            }
          } catch (e) { console.error(e); }
        }
      }
    } catch (err) {
      console.error(err);
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
    const matchesBuddy = selectedFilterBuddies.length === 0 ||
      (d.buddies && d.buddies.some(b => selectedFilterBuddies.some(fb => fb.uid === b.uid))) ||
      (selectedFilterBuddies.some(fb => fb.uid === d.creatorId));
    return afterStart && beforeEnd && matchesBuddy;
  });

  // Stats
  const totalDrinks = drinks.length;
  const totalVolumeCl = drinks.reduce((acc, curr) => acc + (curr.volume || 2), 0);

  // Shared Stats (when buddy filter is active)
  const sharedStats = selectedFilterBuddies.length > 0 ? {
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


  return (
    <>
      <header>
        <h1>Jäger Tracker</h1>
        <button
          onClick={() => setShowSidebar(true)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--jager-orange)', cursor: 'pointer'
          }}
        >
          <User size={20} />
        </button>
      </header>

      {/* Navigation Tabs */}
      {!isKeyboardVisible && (
        <nav className="nav-bar">
          <button
            onClick={() => setView('tracker')}
            className={`nav-item ${view === 'tracker' ? 'active' : ''}`}
          >
            <Target size={18} /> Tracker
          </button>
          <button
            onClick={() => { setView('feed'); setTargetDrinkId(null); }}
            className={`nav-item ${view === 'feed' ? 'active' : ''}`}
          >
            <Rss size={18} /> Feed
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
          <button
            onClick={() => setView('events')}
            className={`nav-item ${view === 'events' ? 'active' : ''}`}
          >
            <Calendar size={18} /> Events
          </button>
        </nav>
      )}

      {notifPermission === 'prompt' && Capacitor.isNativePlatform() && (
        <div style={{ background: '#fbb124', color: 'black', padding: '10px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
          onClick={async () => {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            const res = await LocalNotifications.requestPermissions();
            setNotifPermission(res.display);
            if (res.display === 'granted') window.location.reload(); // Re-trigger listener
          }}>
          🔔 Enable social notifications for the Crew? (Click here)
        </div>
      )}

      {view === 'feed' ? (
        <FriendsFeed targetDrinkId={targetDrinkId} />
      ) : view === 'friends' ? (
        <Friends />
      ) : view === 'events' ? (
        <EventsView currentUser={currentUser} userData={userData} friends={friends} onSelectEvent={(id) => { setSelectedEventId(id); setView('event-details'); }} />
      ) : view === 'event-details' && selectedEventId ? (
        <EventDetails eventId={selectedEventId} currentUser={currentUser} userData={userData} friends={friends} onBack={() => { setSelectedEventId(null); setView('events'); }} />
      ) : view === 'map' ? (
        <AppMapView
          mapShowEvents={mapShowEvents}
          setMapShowEvents={setMapShowEvents}
          selectedMapFilterBuddies={selectedMapFilterBuddies}
          setSelectedMapFilterBuddies={setSelectedMapFilterBuddies}
          setShowMapFilterModal={setShowMapFilterModal}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          sharedStats={sharedStats}
          mapDrinks={mapDrinks}
          locationState={locationState}
          publicEvents={publicEvents}
          onSelectEvent={(id) => { setSelectedEventId(id); setView('events'); }}
          mapSharedOnly={mapSharedOnly}
          currentUser={currentUser}
        />
      ) : (
        <TrackerView
          drinks={drinks}
          handleDrink={handleDrink}
          loading={loading}
          error={error}
          volume={volume}
          setVolume={setVolume}
          drinkComment={drinkComment}
          setDrinkComment={setDrinkComment}
          selectedBuddies={selectedBuddies}
          setSelectedBuddies={setSelectedBuddies}
          handleExport={handleExport}
          handleImport={handleImport}
          handleUpdateDrink={handleUpdateDrink}
          handleDeleteDrink={handleDeleteDrink}
          currentUser={currentUser}
          userData={userData}
          friends={friends}
          editingDrink={editingDrink}
          setEditingDrink={setEditingDrink}
          showCrewModal={showCrewModal}
          setShowCrewModal={setShowCrewModal}
          showVolumeModal={showVolumeModal}
          setShowVolumeModal={setShowVolumeModal}
          showActivityFilterModal={showActivityFilterModal}
          setShowActivityFilterModal={setShowActivityFilterModal}
          selectedFilterBuddies={selectedFilterBuddies}
          setSelectedFilterBuddies={setSelectedFilterBuddies}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          sharedStats={sharedStats}
          filteredDrinks={filteredDrinks}
          totalDrinks={totalDrinks}
          totalVolumeCl={totalVolumeCl}
          lastNightVolume={lastNightVolume}
          setShowMainHelp={setShowMainHelp}
        />
      )}



      {
        showMapFilterModal && (
          <CrewSelector
            friends={friends}
            selectedBuddies={selectedMapFilterBuddies}
            onToggle={setSelectedMapFilterBuddies}
            onClose={() => setShowMapFilterModal(false)}
            title="Filter Map Activity"
            includeMe={true}
            currentUserId={currentUser.uid}
            currentUsername={userData.username}
            showSharedToggle={true}
            sharedOnly={mapSharedOnly}
            onToggleShared={setMapSharedOnly}
          />
        )
      }

      {
        showMainHelp && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
            padding: '1.5rem', backdropFilter: 'blur(5px)'
          }}>
            <div style={{
              background: '#1c1c1c', width: '100%', maxWidth: '340px', borderRadius: '24px',
              padding: '1.5rem', border: '1px solid #333', boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--jager-orange)' }}>App Guide</h3>
                <button onClick={() => setShowMainHelp(false)} style={{ background: 'transparent', border: 'none', color: '#666' }}><X size={24} /></button>
              </div>
              <div style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
                <p><strong>🍻 Quick Shot:</strong> Hit the big button to log a drink! It saves to your history and any <strong>open event</strong> you're in.</p>
                <p><strong>👥 Crew:</strong> Tag friends before drinking! This logs a shot for <strong>YOU</strong> and <strong>THEM</strong>. (Great for buying rounds!).</p>
                <p><strong>🔍 Filters:</strong> Use the "Filter History" button (or Map Filters) to see stats for specific crew members or dates.</p>
                <p><strong>📍 Events:</strong> Join a public event or create your own to see a live leaderboard and map of everyone's shots!</p>
              </div>
              <button
                onClick={() => setShowMainHelp(false)}
                style={{
                  width: '100%', marginTop: '1rem', padding: '12px', background: '#333', color: 'white',
                  border: 'none', borderRadius: '12px', fontWeight: 'bold'
                }}
              >
                Cheers! 🦌
              </button>
            </div>
          </div>
        )
      }



      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        userData={userData}
        totalDrinks={totalDrinks}
        onLogout={logout}
        onShowHelp={() => setShowMainHelp(true)}
      />
    </>
  );
}

export default App;
