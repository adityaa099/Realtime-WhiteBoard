import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (error) {
                    console.error('Auth verification failed', error);
                    localStorage.removeItem('token');
                    sessionStorage.clear();
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    // Intercept 401 responses — auto-logout if token is invalid/expired
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    sessionStorage.clear();
                    setUser(null);
                }
                return Promise.reject(error);
            }
        );
        return () => api.interceptors.response.eject(interceptor);
    }, []);

    // Defeat Browser Back-Forward Cache (bfcache) and cross-tab logouts
    useEffect(() => {
        const handlePageShow = (event) => {
            // event.persisted is true if the page was restored from bfcache (Back button)
            if (event.persisted) {
                if (!localStorage.getItem('token')) {
                    window.location.replace('/login');
                }
            }
        };

        const handleStorageChange = (event) => {
            if (event.key === 'token' && !event.newValue) {
                // Token was deleted in another tab, or via logout
                setUser(null);
                window.location.replace('/login');
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('pageshow', handlePageShow);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data);
    };

    const register = async (username, email, password) => {
        const res = await api.post('/auth/register', { username, email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data);
    };

    const setUserFromOAuth = useCallback(({ token, _id, username, email }) => {
        localStorage.setItem('token', token);
        setUser({ _id, username, email, token });
    }, []);

    const logout = useCallback(() => {
        // Clear ALL stored auth data
        localStorage.removeItem('token');
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);

        // Delete all cookies (including Passport session cookie)
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });

        // Force full page reload to /login — clears all React state
        window.location.replace('/login');
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, setUserFromOAuth }}>
            {loading ? (
                <div className="page-loader"><div className="spinner"></div></div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
