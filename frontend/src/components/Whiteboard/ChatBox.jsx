import React, { useState, useEffect, useRef } from 'react';

const ChatBox = ({ socket, roomId, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive-message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            socket.off('receive-message');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (inputText.trim() && socket) {
            const msgData = {
                roomId,
                message: {
                    id: Date.now() + Math.random(),
                    sender: {
                        _id: currentUser._id,
                        username: currentUser.username
                    },
                    text: inputText.trim(),
                    timestamp: new Date().toISOString()
                }
            };

            socket.emit('send-message', msgData);
            setInputText('');
        }
    };

    return (
        <div className="chat-box">
            <div className="chat-header">
                <h3>Room Chat</h3>
            </div>

            <div className="chat-messages">
                {messages.map((msg) => {
                    const isOwn = msg.sender._id === currentUser._id;
                    return (
                        <div key={msg.id} className={`message-wrapper ${isOwn ? 'own-message' : ''}`}>
                            {!isOwn && <span className="sender-name">{msg.sender.username}</span>}
                            <div className="message-bubble">
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    autoComplete="off"
                />
                <button type="submit" className="btn btn-primary btn-sm">Send</button>
            </form>
        </div>
    );
};

export default ChatBox;
