import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { user, logout } = useContext(AuthContext);
    const [isDark, setIsDark] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    const toggleTheme = () => {
        const next = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        setIsDark(!isDark);
    };

    return (
        <div className="home-container">
            {/* Animated background elements */}
            <div className="home-bg-orbs">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            <nav className="home-nav" id="home-nav">
                <div className="logo">
                    <span className="logo-icon">◆</span>
                    CollabBoard
                </div>
                <div className="nav-links">
                    <button onClick={toggleTheme} className="btn btn-ghost btn-sm" title="Toggle theme">
                        {isDark ? '☀️' : '🌙'}
                    </button>
                    {user ? (
                        <>
                            <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
                            <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Sign in</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                        </>
                    )}
                </div>
            </nav>

            <main className="hero-section">
                <div className="pattern-bg" />
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        Real-time collaboration for modern teams
                    </div>
                    <h1>
                        Create, Share,<br />
                        <span className="text-gradient">Collaborate in Real-time.</span>
                    </h1>
                    <p className="hero-subtitle">
                        A premium whiteboard experience built for teams.
                        Draw, chat, and ideate together instantly from anywhere in the world.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary btn-lg" id="hero-cta-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                            Get Started Free
                        </Link>
                        <Link to="/login" className="btn btn-outline btn-lg" id="hero-cta-secondary">View Dashboard</Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-number">∞</span>
                            <span className="stat-label">Canvas Size</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">&lt;50ms</span>
                            <span className="stat-label">Sync Latency</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">100%</span>
                            <span className="stat-label">Free</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="mock-board">
                        <div className="mock-toolbar">
                            <div className="mock-dots">
                                <div className="mock-dot red"></div>
                                <div className="mock-dot yellow"></div>
                                <div className="mock-dot green"></div>
                            </div>
                            <span className="mock-title">CollabBoard — Session</span>
                        </div>
                        <div className="mock-canvas">
                            <svg width="100%" height="100%" viewBox="0 0 600 280" preserveAspectRatio="xMidYMid meet">
                                <path d="M 40,180 Q 120,40 200,140 T 380,120 Q 460,100 540,160" fill="none" stroke="var(--primary-color)" strokeWidth="3" strokeLinecap="round" className="draw-anim" opacity="0.8" />
                                <path d="M 80,220 Q 200,160 320,200 T 500,180" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" className="draw-anim-2" opacity="0.6" />
                                <circle cx="200" cy="140" r="6" fill="var(--primary-color)" opacity="0.4" className="pulsing-dot" />
                                <circle cx="380" cy="120" r="6" fill="#8b5cf6" opacity="0.4" className="pulsing-dot-2" />
                            </svg>
                            <div className="mock-cursor cursor-1">
                                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M0 0l6.5 16 2-6 6-2z" fill="#6366f1" /></svg>
                                <span className="cursor-label">Alice</span>
                            </div>
                            <div className="mock-cursor cursor-2">
                                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M0 0l6.5 16 2-6 6-2z" fill="#8b5cf6" /></svg>
                                <span className="cursor-label purple">Bob</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <section className="features-section" id="features">
                <div className="section-header">
                    <span className="section-badge">Features</span>
                    <h2>Everything you need to collaborate</h2>
                    <p>Powerful tools designed for seamless team creativity</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card" id="feature-realtime">
                        <div className="feature-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                        </div>
                        <h3>Lightning Fast</h3>
                        <p>Real-time synchronization powered by WebSockets ensures you see every stroke instantly.</p>
                    </div>
                    <div className="feature-card" id="feature-tools">
                        <div className="feature-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>
                        </div>
                        <h3>Premium Tools</h3>
                        <p>Pencils, erasers, color pickers, brush sizes, undo/redo — all in a sleek interface.</p>
                    </div>
                    <div className="feature-card" id="feature-chat">
                        <div className="feature-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        </div>
                        <h3>Integrated Chat</h3>
                        <p>Discuss ideas right next to the canvas without leaving your workflow.</p>
                    </div>
                    <div className="feature-card" id="feature-screenshare">
                        <div className="feature-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                        </div>
                        <h3>Screen Sharing</h3>
                        <p>Share your screen with the room via WebRTC for presentations and walkthroughs.</p>
                    </div>
                    <div className="feature-card" id="feature-recording">
                        <div className="feature-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                        </div>
                        <h3>Session Recording</h3>
                        <p>Record your whiteboard sessions and download them for later review.</p>
                    </div>
                    <div className="feature-card" id="feature-security">
                        <div className="feature-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <h3>Secure Rooms</h3>
                        <p>Private rooms with unique IDs and JWT authentication keep your work safe.</p>
                    </div>
                </div>
            </section>

            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="logo-icon">◆</span> CollabBoard
                    </div>
                    <p>Built with ❤️ for teams that create together.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
