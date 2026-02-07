import { useState, useEffect } from 'react';
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { subscribeToComments, addComment } from '../utils/storage';

export default function CommentSection({
    drinkId,
    ownerId,
    currentUser,
    userData,
    initialShow = false,
    onCommentAdded
}) {
    const [comments, setComments] = useState([]);
    const [showComments, setShowComments] = useState(initialShow);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);

    // Subscribe to comments only when expanded
    useEffect(() => {
        if (showComments) {
            const unsub = subscribeToComments(ownerId, drinkId, setComments);
            return unsub;
        }
    }, [showComments, ownerId, drinkId]);

    const handleSendComment = async () => {
        if (!newComment.trim() || sending) return;
        setSending(true);
        try {
            await addComment(ownerId, drinkId, currentUser.uid, userData.username, newComment);
            setNewComment('');
            if (onCommentAdded) onCommentAdded();
        } catch (err) {
            console.error('Comment error:', err);
            alert(err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Comments Toggle */}
            <button
                onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 0'
                }}
            >
                <MessageCircle size={16} />
                {comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? 's' : ''}` : 'Add comment'}
                {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Comments Section */}
            {showComments && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}
                >
                    {comments.map(comment => (
                        <div key={comment.id} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: '#444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.65rem', color: '#aaa', flexShrink: 0
                                }}>
                                    {comment.username?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 'bold', color: '#ddd', fontSize: '0.85rem' }}>
                                        {comment.username}
                                    </span>
                                    <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: '8px' }}>
                                        {format(new Date(comment.timestamp), 'MMM d, h:mm a')}
                                    </span>
                                    <div style={{ color: '#bbb', fontSize: '0.85rem', marginTop: '2px' }}>
                                        {comment.text}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* New Comment Input */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            maxLength={200}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px',
                                padding: '10px 14px',
                                color: 'white',
                                fontSize: '0.85rem'
                            }}
                        />
                        <button
                            onClick={handleSendComment}
                            disabled={!newComment.trim() || sending}
                            style={{
                                background: newComment.trim() ? '#fbb124' : '#444',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px', height: '40px',
                                aspectRatio: '1',
                                padding: 0,
                                flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                                color: newComment.trim() ? 'black' : '#888'
                            }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
