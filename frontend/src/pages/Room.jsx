import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../api';

import Canvas from '../components/Whiteboard/Canvas';
import Toolbar from '../components/Whiteboard/Toolbar';
import ChatBox from '../components/Whiteboard/ChatBox';
import Participants from '../components/Whiteboard/Participants';
import WebRTCControls from '../components/Whiteboard/WebRTCControls';
import SessionControls from '../components/Whiteboard/SessionControls';
import './Room.css';

const Room = () => {
    const { roomId } = useParams();
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const navigate = useNavigate();

    const [roomDetails, setRoomDetails] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joinStatus, setJoinStatus] = useState('checking'); // 'checking' | 'requesting' | 'joined' | 'rejected'
    const [pendingRequests, setPendingRequests] = useState([]);
    const [copied, setCopied] = useState(false);

    // Whiteboard state
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);

    // Multi-page state
    const [pages, setPages] = useState([{ id: 1, history: [], undone: [] }]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // Current page helpers
    const currentPage = pages[currentPageIndex];
    const drawHistory = currentPage.history;
    const undoneActions = currentPage.undone;

    const setDrawHistory = useCallback((valOrFn) => {
        setPages(prev => {
            const updated = [...prev];
            const page = { ...updated[currentPageIndex] };
            page.history = typeof valOrFn === 'function' ? valOrFn(page.history) : valOrFn;
            updated[currentPageIndex] = page;
            return updated;
        });
    }, [currentPageIndex]);

    const setUndoneActions = useCallback((valOrFn) => {
        setPages(prev => {
            const updated = [...prev];
            const page = { ...updated[currentPageIndex] };
            page.undone = typeof valOrFn === 'function' ? valOrFn(page.undone) : valOrFn;
            updated[currentPageIndex] = page;
            return updated;
        });
    }, [currentPageIndex]);

    // Canvas ref (forwarded for recording)
    const canvasRef = useRef(null);

    // Theme
    const [isDark, setIsDark] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    const toggleTheme = () => {
        const next = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        setIsDark(!isDark);
    };

    useEffect(() => {
        if (!socket || !user) return;

        const handleRoomReady = (roomInfo) => {
            setRoomDetails(roomInfo);
            setJoinStatus('joined');
            socket.emit('join-room', { roomId, user });

            socket.on('room-participants', (users) => setParticipants(users));

            socket.on('user-joined', (newUser) => {
                setParticipants(prev => {
                    if (!prev.find(p => p._id === newUser.userId || p._id === newUser._id)) {
                        return [...prev, { ...newUser, _id: newUser.userId || newUser._id }];
                    }
                    return prev;
                });
            });

            socket.on('user-left', ({ socketId }) => {
                setParticipants(prev => prev.filter(p => p.socketId !== socketId));
            });
            setLoading(false);
        };

        const setupRoom = async () => {
            try {
                // Fetch room info first to see if we're a host/participant
                const res = await api.get(`/rooms/${roomId}`);
                const roomInfo = res.data;

                const isHost = roomInfo.hostId?.toString() === user._id?.toString() || roomInfo.hostId === user._id;
                const isParticipant = roomInfo.participants?.includes(user._id);

                if (isHost || isParticipant) {
                    // Directly join if already allowed
                    handleRoomReady(roomInfo);
                } else {
                    // Send join request to host periodically to handle host refresh issues
                    setJoinStatus('requesting');
                    setLoading(false);
                    socket.emit('request-to-join', { roomId, user });

                    const intervalId = setInterval(() => {
                        socket.emit('request-to-join', { roomId, user });
                    }, 3000);

                    // Listen for the response
                    socket.on('join-request-response', ({ status }) => {
                        clearInterval(intervalId);
                        if (status === 'approved') {
                            handleRoomReady(roomInfo);
                        } else {
                            setJoinStatus('rejected');
                        }
                    });
                }

                if (isHost) {
                    socket.on('join-request', (requestData) => {
                        setPendingRequests(prev => {
                            if (prev.find(r => r.user._id === requestData.user._id)) return prev;
                            return [...prev, requestData];
                        });
                    });
                }
            } catch (err) {
                console.error('Room Check Error:', err);
                alert('Room not found or server error.');
                navigate('/dashboard');
            }
        };

        setupRoom();

        return () => {
            socket.emit('leave-room', { roomId, userId: user._id });
            socket.off('room-participants');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('join-request-response');
            socket.off('join-request');
        };
    }, [roomId, socket, user, navigate]);

    // Listen for room-ended event (host deleted the room)
    useEffect(() => {
        if (!socket) return;
        const handleRoomEnded = () => {
            alert('This room has been ended by the host.');
            navigate('/dashboard');
        };
        socket.on('room-ended', handleRoomEnded);
        return () => socket.off('room-ended', handleRoomEnded);
    }, [socket, navigate]);

    const handleUndo = useCallback(() => {
        if (drawHistory.length === 0) return;
        const newHistory = drawHistory.slice(0, -1);
        const undoneAction = drawHistory[drawHistory.length - 1];
        setDrawHistory(newHistory);
        setUndoneActions(prev => [...prev, undoneAction]);
        if (socket) socket.emit('undo-action', { roomId, history: newHistory });
    }, [drawHistory, socket, roomId, setDrawHistory, setUndoneActions]);

    const handleRedo = useCallback(() => {
        if (undoneActions.length === 0) return;
        const actionToRedo = undoneActions[undoneActions.length - 1];
        const newUndone = undoneActions.slice(0, -1);
        const newHistory = [...drawHistory, actionToRedo];
        setDrawHistory(newHistory);
        setUndoneActions(newUndone);
        if (socket) socket.emit('draw-action', { roomId, action: actionToRedo });
    }, [undoneActions, drawHistory, socket, roomId, setDrawHistory, setUndoneActions]);

    // Keyboard shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    const clearBoard = () => {
        if (!socket) return;
        socket.emit('clear-board', { roomId });
        setDrawHistory([]);
        setUndoneActions([]);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `whiteboard-page${currentPageIndex + 1}-${roomId}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Page management
    const addPage = () => {
        const newPage = { id: pages.length + 1, history: [], undone: [] };
        setPages(prev => [...prev, newPage]);
        setCurrentPageIndex(pages.length); // Switch to new page
    };

    const switchPage = (index) => {
        if (index === currentPageIndex) return;
        setCurrentPageIndex(index);
    };

    const deletePage = (index) => {
        if (pages.length <= 1) return; // Can't delete last page
        setPages(prev => prev.filter((_, i) => i !== index));
        if (currentPageIndex >= index && currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
        }
    };

    // End / Delete Room (host only)
    const endRoom = async () => {
        if (!window.confirm('Are you sure you want to end this room? This will remove all participants and delete the room permanently.')) return;
        try {
            await api.delete(`/rooms/${roomId}`);
            if (socket) socket.emit('end-room', { roomId });
            navigate('/dashboard');
        } catch {
            alert('Failed to end room.');
        }
    };

    const isHost = roomDetails?.hostId?.toString() === user?._id?.toString() ||
        roomDetails?.hostId === user?._id;

    const handleJoinResponse = (request, status) => {
        socket.emit('respond-join-request', {
            targetSocketId: request.socketId,
            status,
            roomId,
            userId: request.user._id
        });
        setPendingRequests(prev => prev.filter(r => r.socketId !== request.socketId));
    };

    if (loading || joinStatus === 'checking') return <div className="room-loading">Joining Room…</div>;

    if (joinStatus === 'requesting') {
        return (
            <div className="room-loading" style={{ flexDirection: 'column', gap: '15px' }}>
                <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4, display: 'block', margin: '0 auto' }}></span>
                <h3>Waiting for Host Approval...</h3>
                <p>The host of this room must allow you to join.</p>
                <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ marginTop: 20 }}>
                    Cancel & Return
                </button>
            </div>
        );
    }

    if (joinStatus === 'rejected') {
        return (
            <div className="room-loading" style={{ flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ color: '#ef4444' }}>Request Declined</h3>
                <p>The host declined your request to join.</p>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ marginTop: 20 }}>
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="room-layout">
            {/* Host Join Requests Toast */}
            {isHost && pendingRequests.length > 0 && (
                <div className="join-requests-overlay">
                    {pendingRequests.map((req, i) => (
                        <div key={i} className="join-request-card">
                            <div className="join-request-header">
                                <div className="join-avatar">{req.user.username.charAt(0).toUpperCase()}</div>
                                <div className="join-info">
                                    <h4>{req.user.username}</h4>
                                    <span>Wants to join</span>
                                </div>
                            </div>
                            <div className="join-request-actions">
                                <button onClick={() => handleJoinResponse(req, 'rejected')} className="btn btn-outline btn-sm action-deny">Deny</button>
                                <button onClick={() => handleJoinResponse(req, 'approved')} className="btn btn-primary btn-sm action-allow">Allow</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <header className="room-header">
                <div className="room-title">
                    <h2>{roomDetails?.name || 'Whiteboard'}</h2>
                    <span className="room-id-badge" onClick={copyRoomId} title="Click to copy">
                        {copied ? '✓ Copied!' : `ID: ${roomId} 📋`}
                    </span>
                    {isHost && <span className="host-badge">Host</span>}
                </div>

                {/* Page Tabs */}
                <div className="page-tabs">
                    {pages.map((page, idx) => (
                        <div
                            key={page.id}
                            className={`page-tab ${idx === currentPageIndex ? 'active' : ''}`}
                            onClick={() => switchPage(idx)}
                        >
                            <span>Page {idx + 1}</span>
                            {pages.length > 1 && (
                                <button
                                    className="page-tab-close"
                                    onClick={(e) => { e.stopPropagation(); deletePage(idx); }}
                                    title="Delete page"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                    <button className="page-add-btn" onClick={addPage} title="Add new page">
                        + Add Page
                    </button>
                </div>

                <div className="room-actions">
                    <button onClick={toggleTheme} className="btn btn-sm room-action-btn" title="Toggle theme">
                        {isDark ? '☀️' : '🌙'}
                    </button>
                    {isHost && (
                        <button onClick={endRoom} className="btn btn-sm btn-end-room" title="End room for everyone">
                            🛑 End Room
                        </button>
                    )}
                    <button onClick={() => navigate('/dashboard')} className="btn btn-outline btn-sm">
                        Leave Room
                    </button>
                </div>
            </header>

            <div className="room-content">
                {/* LEFT SIDEBAR */}
                <aside className="room-sidebar-left">
                    <Toolbar
                        tool={tool} setTool={setTool}
                        color={color} setColor={setColor}
                        brushSize={brushSize} setBrushSize={setBrushSize}
                        clearBoard={clearBoard}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={drawHistory.length > 0}
                        canRedo={undoneActions.length > 0}
                        onSave={handleSave}
                    />

                    {/* Screen Share */}
                    <div className="tool-group">
                        <label>Screen</label>
                        <WebRTCControls socket={socket} roomId={roomId} />
                    </div>

                    {/* Session recording + file sharing */}
                    <SessionControls
                        socket={socket}
                        roomId={roomId}
                        canvasRef={canvasRef}
                    />
                </aside>

                {/* CANVAS */}
                <main className="room-canvas-area">
                    <Canvas
                        key={currentPageIndex}
                        socket={socket}
                        roomId={roomId}
                        color={color}
                        brushSize={brushSize}
                        tool={tool}
                        drawHistory={drawHistory}
                        setDrawHistory={setDrawHistory}
                        undoneActions={undoneActions}
                        setUndoneActions={setUndoneActions}
                        ref={canvasRef}
                    />
                </main>

                {/* RIGHT SIDEBAR */}
                <aside className="room-sidebar-right">
                    <Participants
                        participants={participants}
                        hostId={roomDetails?.hostId}
                    />
                    <div className="chat-container-wrapper">
                        <ChatBox socket={socket} roomId={roomId} currentUser={user} />
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Room;
