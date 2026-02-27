import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [rooms, setRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [creatingRoom, setCreatingRoom] = useState(false);
    const navigate = useNavigate();

    const [isDark, setIsDark] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
        } catch {
            console.error('Failed to fetch rooms');
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setCreatingRoom(true);
        try {
            const res = await api.post('/rooms', { name: newRoomName });
            navigate(`/room/${res.data.roomId}`);
        } catch {
            console.error('Failed to create room');
        } finally {
            setCreatingRoom(false);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (joinRoomId.trim()) {
            await joinRoomDirectly(joinRoomId.trim());
        }
    };

    const joinRoomDirectly = async (id) => {
        try {
            await api.post(`/rooms/join/${id}`);
            navigate(`/room/${id}`);
        } catch {
            alert('Failed to join room. Please check the Room ID.');
        }
    };

    const toggleTheme = () => {
        const next = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        setIsDark(!isDark);
    };

    const userInitial = user?.username?.charAt(0)?.toUpperCase() || '?';

    return (
        <div className="dashboard-container">
            <header className="dashboard-header" id="dashboard-header">
                <div className="header-left">
                    <div className="header-brand">
                        <span className="logo-icon">◆</span>
                        <h1>CollabBoard</h1>
                    </div>
                </div>
                <div className="header-right">
                    <button onClick={toggleTheme} className="btn btn-ghost btn-sm" title="Toggle theme">
                        {isDark ? '☀️' : '🌙'}
                    </button>
                    <div className="user-info">
                        <div className="user-avatar">{userInitial}</div>
                        <span className="user-name">{user?.username}</span>
                    </div>
                    <button onClick={logout} className="btn btn-outline btn-sm" id="logout-btn">Logout</button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-welcome">
                    <h2>Welcome back, <span className="text-gradient">{user?.username}</span> 👋</h2>
                    <p>Create a new room or join an existing one to start collaborating.</p>
                </div>

                <section className="action-section">
                    <div className="action-card" id="create-room-card">
                        <div className="action-card-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                        </div>
                        <h3>Create New Room</h3>
                        <p>Start a fresh collaborative session</p>
                        <form onSubmit={handleCreateRoom} className="action-form">
                            <input
                                type="text"
                                placeholder="Room Name (Optional)"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                id="create-room-input"
                            />
                            <button type="submit" className="btn btn-primary" disabled={creatingRoom} id="create-room-btn">
                                {creatingRoom ? (
                                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Creating...</>
                                ) : '+ Create Room'}
                            </button>
                        </form>
                    </div>

                    <div className="action-card" id="join-room-card">
                        <div className="action-card-icon join-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                        </div>
                        <h3>Join Existing Room</h3>
                        <p>Enter a Room ID to collaborate</p>
                        <form onSubmit={handleJoinRoom} className="action-form">
                            <input
                                type="text"
                                placeholder="Paste Room ID here"
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                                required
                                id="join-room-input"
                            />
                            <button type="submit" className="btn btn-primary" id="join-room-btn">
                                → Join Room
                            </button>
                        </form>
                    </div>
                </section>

                <section className="rooms-section" id="rooms-section">
                    <div className="rooms-header">
                        <h2>Recent Rooms</h2>
                        <button onClick={fetchRooms} className="btn btn-ghost btn-sm" title="Refresh">
                            🔄 Refresh
                        </button>
                    </div>
                    <div className="rooms-grid">
                        {loadingRooms ? (
                            <div className="rooms-loading">
                                <span className="spinner"></span>
                                <p>Loading rooms...</p>
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className="no-rooms" id="no-rooms-msg">
                                <div className="no-rooms-icon">📋</div>
                                <p>No active rooms right now.</p>
                                <span>Create one to get started!</span>
                            </div>
                        ) : (
                            rooms.map((room, idx) => (
                                <div
                                    key={room._id}
                                    className="room-card"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    <div className="room-card-header">
                                        <h4>{room.name || 'Untitled Room'}</h4>
                                        <span className="room-status-dot" title="Active"></span>
                                    </div>
                                    <div className="room-card-meta">
                                        <p className="room-meta">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                            {room.roomId}
                                        </p>
                                        <p className="room-meta">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                            {room.hostId?.username || 'Unknown'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => joinRoomDirectly(room.roomId)}
                                        className="btn btn-primary btn-sm room-join-btn"
                                    >
                                        Join →
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
