import React, { useRef, useState, useEffect, useCallback } from 'react';

const WebRTCControls = ({ socket, roomId }) => {
    const [isSharing, setIsSharing] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const remoteVideoRef = useRef(null);


    const createPeerConnection = useCallback((targetSocketId) => {
        const iceConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        const pc = new RTCPeerConnection(iceConfig);

        pc.onicecandidate = (e) => {
            if (e.candidate && socket) {
                socket.emit('webrtc-ice-candidate', {
                    candidate: e.candidate,
                    targetSocketId,
                    roomId
                });
            }
        };

        pc.ontrack = (e) => {
            if (e.streams[0]) {
                setRemoteStream(e.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = e.streams[0];
                }
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [socket, roomId]);

    useEffect(() => {
        if (!socket) return;

        socket.on('webrtc-offer', async ({ offer, senderId }) => {
            const pc = createPeerConnection(senderId);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-answer', { answer, targetSocketId: senderId });
        });

        socket.on('webrtc-answer', async ({ answer }) => {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('webrtc-ice-candidate', async ({ candidate }) => {
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) { console.error('ICE candidate error', e); }
            }
        });

        return () => {
            socket.off('webrtc-offer');
            socket.off('webrtc-answer');
            socket.off('webrtc-ice-candidate');
        };
    }, [socket, createPeerConnection]);

    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            setIsSharing(true);

            const pc = createPeerConnection(null);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('webrtc-offer', { roomId, offer });

            // Handle stop sharing
            stream.getVideoTracks()[0].onended = () => stopScreenShare();
        } catch (err) {
            console.error('Screen share error:', err);
            alert('Could not start screen sharing. Please allow screen capture permission.');
        }
    };

    const stopScreenShare = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setIsSharing(false);
    };

    return (
        <div className="webrtc-controls">
            {!isSharing ? (
                <button className="tool-btn" onClick={startScreenShare} title="Share your screen">
                    🖥 Share
                </button>
            ) : (
                <button className="tool-btn" onClick={stopScreenShare} style={{ color: '#ef4444' }} title="Stop sharing">
                    ⏹ Stop
                </button>
            )}

            {remoteStream && (
                <div className="remote-screen-overlay">
                    <div className="remote-screen-header">
                        <span>📺 Screen Share</span>
                        <button onClick={() => setRemoteStream(null)}>✕</button>
                    </div>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="remote-video"
                    />
                </div>
            )}
        </div>
    );
};

export default WebRTCControls;
