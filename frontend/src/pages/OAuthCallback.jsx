import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const { setUserFromOAuth } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const username = searchParams.get('username');
        const email = searchParams.get('email');
        const error = searchParams.get('error');

        if (error) {
            navigate('/login?error=' + error, { replace: true });
            return;
        }

        if (token && userId && username && email) {
            // Strip the sensitive parameters from the URL immediately so they don't stay in browser history
            window.history.replaceState({}, document.title, window.location.pathname);

            setUserFromOAuth({ token, _id: userId, username, email });
            // Use replace: true so this callback sequence isn't saved in the back button history
            navigate('/dashboard', { replace: true });
        } else {
            navigate('/login?error=oauth_failed', { replace: true });
        }
    }, [searchParams, navigate, setUserFromOAuth]);

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <div className="oauth-loading-spinner"></div>
                <h2 style={{ marginTop: '1rem' }}>Signing you in...</h2>
                <p className="auth-subtitle">Please wait while we complete authentication.</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
