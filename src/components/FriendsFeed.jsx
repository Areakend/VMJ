import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
    subscribeToFriends,
    subscribeToFriendsDrinks,
    subscribeToReactions,
    addReaction,
    removeReaction
} from '../utils/storage';
import CommentSection from './CommentSection';

const REACTION_EMOJIS = ['🍻', '🎉', '🔥', '😵'];

function DrinkCard({ drink, currentUser, userData, targetDrinkId, friends }) {

    const [reactions, setReactions] = useState([]);
    const [showReactors, setShowReactors] = useState(false);
    const cardRef = useRef(null);

    const isHighlighted = targetDrinkId === drink.id;

    // Scroll into view if this is the target drink
    useEffect(() => {
        if (isHighlighted && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isHighlighted]);

    // Subscribe to reactions
    useEffect(() => {
        const unsub = subscribeToReactions(drink.ownerId, drink.id, setReactions);
        return unsub;
    }, [drink.ownerId, drink.id]);


    const handleReaction = async (emoji) => {
        try {
            const existingReaction = reactions.find(r => r.uid === currentUser.uid);
            if (existingReaction?.emoji === emoji) {
                // Remove reaction if same emoji clicked
                await removeReaction(drink.ownerId, drink.id, currentUser.uid);
            } else {
                // Add/change reaction
                await addReaction(drink.ownerId, drink.id, currentUser.uid, userData.username, emoji);
            }
        } catch (err) {
            console.error('Reaction error:', err);
        }
    };


    const myReaction = reactions.find(r => r.uid === currentUser.uid)?.emoji;

    return (
        <div
            ref={cardRef}
            style={{
                background: isHighlighted ? 'rgba(251, 177, 36, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: isHighlighted ? '2px solid var(--jager-orange)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '12px',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fbb124, #e89b00)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', color: 'black', fontSize: '0.9rem'
                    }}>
                        {drink.ownerUsername?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', color: '#fbb124' }}>{drink.ownerUsername}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            {format(new Date(drink.timestamp), 'MMM d, yyyy • h:mm a')}
                        </div>
                    </div>
                </div>
                <div style={{
                    background: 'rgba(251, 177, 36, 0.2)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    color: '#fbb124',
                    fontWeight: 'bold',
                    alignSelf: 'start'
                }}>
                    {drink.volume || 2}cl
                </div>
            </div>

            {/* Location & Comment */}
            {drink.locationName && (
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>
                    📍 {drink.locationName}
                </div>
            )}
            {drink.comment && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    marginBottom: '12px',
                    fontSize: '0.9rem',
                    color: '#ddd',
                    fontStyle: 'italic'
                }}>
                    "{drink.comment}"
                </div>
            )}

            {/* Reactions Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {REACTION_EMOJIS.map(emoji => {
                    const count = reactions.filter(r => r.emoji === emoji).length;
                    const isMyReaction = myReaction === emoji;
                    return (
                        <button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            style={{
                                background: isMyReaction ? 'rgba(251, 177, 36, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                                border: isMyReaction ? '1px solid #fbb124' : '1px solid transparent',
                                borderRadius: '20px',
                                padding: '6px 12px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                            }}
                        >
                            {emoji}
                            {count > 0 && <span style={{ fontSize: '0.75rem', color: '#888' }}>{count}</span>}
                        </button>
                    );
                })}
            </div>

            {reactions.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                    <div
                        onClick={() => setShowReactors(!showReactors)}
                        style={{ fontSize: '0.75rem', color: '#888', cursor: 'pointer', display: 'inline-block' }}
                    >
                        {showReactors ? 'Hide reactions' : `See who reacted (${reactions.length})`}
                    </div>

                    {showReactors && (
                        <div style={{
                            marginTop: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            padding: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            {reactions.map(r => (
                                <div key={r.id || r.uid} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ccc' }}>
                                    <span>{r.uid === currentUser.uid ? 'You' : r.username}</span>
                                    <span>{r.emoji}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Comment Section Replaced */}
            <CommentSection
                drinkId={drink.id}
                ownerId={drink.ownerId}
                currentUser={currentUser}
                userData={userData}
            />
        </div>
    );
}

export default function FriendsFeed({ targetDrinkId }) {
    const { currentUser, userData } = useAuth();
    const [friends, setFriends] = useState([]);
    const [drinks, setDrinks] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(true);
    const [drinksLoading, setDrinksLoading] = useState(false);

    // Subscribe to friends
    useEffect(() => {
        if (!currentUser) return;
        setFriendsLoading(true);
        const unsub = subscribeToFriends(currentUser.uid, (data) => {
            setFriends(data);
            setFriendsLoading(false);
        });
        return unsub;
    }, [currentUser]);

    // Subscribe to friends' drinks
    useEffect(() => {
        if (!currentUser || friends.length === 0) {
            setDrinks([]);
            return;
        }

        setDrinksLoading(true);
        const unsub = subscribeToFriendsDrinks(currentUser.uid, friends, (allDrinks) => {
            setDrinks(allDrinks);
            setDrinksLoading(false);
        });
        return unsub;
    }, [currentUser, friends]);

    const loading = friendsLoading || drinksLoading;

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                Loading feed...
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                <h3 style={{ color: '#fbb124', marginBottom: '0.5rem' }}>No Friends Yet</h3>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>
                    Add some drinking buddies to see their shots here!
                </p>
            </div>
        );
    }

    if (drinks.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍻</div>
                <h3 style={{ color: '#fbb124', marginBottom: '0.5rem' }}>No Shots Yet</h3>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>
                    Your friends haven't logged any drinks yet. Be the first!
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem' }}>
            <h2 style={{
                color: '#fbb124',
                marginBottom: '1rem',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                🦌 Crew Activity
            </h2>

            {drinks.map(drink => (
                <DrinkCard
                    key={`${drink.ownerId}-${drink.id}`}
                    drink={drink}
                    currentUser={currentUser}
                    userData={userData}
                    targetDrinkId={targetDrinkId}
                    friends={friends}
                />
            ))}
        </div>
    );
}
