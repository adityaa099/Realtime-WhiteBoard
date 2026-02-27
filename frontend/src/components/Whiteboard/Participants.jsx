import React from 'react';

const Participants = ({ participants, hostId }) => {
    return (
        <div className="participants-list">
            <h3>In Room ({participants.length})</h3>
            <ul>
                {participants.map(p => (
                    <li key={p._id} className="participant-item">
                        <span className="p-avatar">{p.username.charAt(0).toUpperCase()}</span>
                        <span className="p-name">{p.username}</span>
                        {p._id === hostId && <span className="host-badge">Host</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Participants;
