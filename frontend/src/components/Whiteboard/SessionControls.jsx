import React, { useRef, useState } from 'react';

const SessionControls = ({ socket, roomId, canvasRef }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // ----- SESSION RECORDING -----
    const startRecording = () => {
        const canvas = canvasRef?.current;
        if (!canvas) return alert('Canvas not ready');

        try {
            const stream = canvas.captureStream(30); // 30fps
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `whiteboard-session-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch {
            alert('Recording not supported in this browser.');
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    // ----- FILE SHARING -----
    const handleFileShare = (e) => {
        const file = e.target.files[0];
        if (!file || !socket) return;

        if (file.size > 5 * 1024 * 1024) {
            return alert('File too large. Max 5MB for sharing.');
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            socket.emit('send-message', {
                roomId,
                message: {
                    id: Date.now() + Math.random(),
                    sender: { _id: 'file', username: 'File' },
                    text: `📎 [File] ${file.name}`,
                    fileData: ev.target.result,
                    fileName: file.name,
                    fileType: file.type,
                    timestamp: new Date().toISOString(),
                    isFile: true
                }
            });
        };
        reader.readAsDataURL(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="tool-group">
            <label>Session</label>
            <div className="tool-buttons">
                {!isRecording ? (
                    <button className="tool-btn" onClick={startRecording} title="Record Session">
                        🔴 Record
                    </button>
                ) : (
                    <button className="tool-btn" onClick={stopRecording} style={{ color: '#ef4444' }} title="Stop Recording">
                        ⏹ Stop Rec
                    </button>
                )}
                <label className="tool-btn" style={{ textAlign: 'center', cursor: 'pointer' }} title="Share a file">
                    📂 File
                    <input
                        type="file"
                        onChange={handleFileShare}
                        style={{ display: 'none' }}
                    />
                </label>
            </div>
        </div>
    );
};

export default SessionControls;
