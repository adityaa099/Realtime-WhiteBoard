const WhiteboardData = require('../models/WhiteboardData');
const Room = require('../models/Room');

module.exports = (io) => {
    io.on('connection', (socket) => {
        // ROOM MANAGEMENT
        socket.on('request-to-join', ({ roomId, user }) => {
            console.log(`[Socket] request-to-join received from ${user.username} for room ${roomId}`);
            // Forward the request to everyone in the room (the host will be the one to respond)
            socket.to(roomId).emit('join-request', { user, socketId: socket.id });
            console.log(`[Socket] Broadcasted join-request to room ${roomId}`);
        });

        socket.on('respond-join-request', async ({ targetSocketId, status, roomId, userId }) => {
            // Send the response back to the user who requested
            io.to(targetSocketId).emit('join-request-response', { status });

            // If approved, add to participants in DB
            if (status === 'approved') {
                try {
                    const room = await Room.findOne({ roomId });
                    if (room && !room.participants.includes(userId)) {
                        room.participants.push(userId);
                        await room.save();
                    }
                } catch (err) {
                    console.error('Error adding participant:', err);
                }
            }
        });

        socket.on('join-room', async ({ roomId, user }) => {
            socket.join(roomId);
            // Store user details in socket
            socket.user = user;
            socket.roomId = roomId;

            // Broadcast to others in the room
            socket.to(roomId).emit('user-joined', {
                userId: user._id,
                username: user.username,
                socketId: socket.id
            });

            // Send current participants to the joined user
            // Send current participants to the joined user (deduplicated by userId)
            const clients = await io.in(roomId).fetchSockets();
            const rawParticipants = clients.map(c => c.user).filter(Boolean);

            const uniqueParticipants = Array.from(
                new Map(rawParticipants.map(item => [item._id, item])).values()
            );

            socket.emit('room-participants', uniqueParticipants);
        });

        socket.on('leave-room', ({ roomId, userId }) => {
            socket.leave(roomId);
            socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
        });

        socket.on('disconnect', () => {
            if (socket.roomId && socket.user) {
                socket.to(socket.roomId).emit('user-left', {
                    userId: socket.user._id,
                    socketId: socket.id
                });
            }
        });

        // DRAWING SYNCHRONIZATION
        socket.on('draw-action', async (data) => {
            const { roomId, action } = data;
            // Broadcast to others immediately for real-time feel
            socket.to(roomId).emit('draw-action', action);

            // Periodically or directly save to DB (Optimization: could use Redis or debounce buffer)
            try {
                await WhiteboardData.findOneAndUpdate(
                    { roomId },
                    { $push: { history: action } },
                    { upsert: true }
                );
            } catch (err) {
                console.error('Error saving drawing action:', err);
            }
        });

        socket.on('clear-board', async ({ roomId }) => {
            io.to(roomId).emit('clear-board');
            try {
                await WhiteboardData.findOneAndUpdate(
                    { roomId },
                    { history: [], snapshot: null }
                );
            } catch (err) { }
        });

        socket.on('undo-action', async ({ roomId, history }) => {
            // Broadcast the trimmed history so all clients can redraw
            socket.to(roomId).emit('undo-action', { history });
            // Optionally persist
            try {
                await WhiteboardData.findOneAndUpdate({ roomId }, { history });
            } catch (err) { }
        });

        // ROOM END / DELETE (host only)
        socket.on('end-room', ({ roomId }) => {
            io.to(roomId).emit('room-ended', { roomId });
        });

        // CHAT MANAGEMENT
        socket.on('send-message', (data) => {
            const { roomId, message } = data;
            // We could save this to MongoDB Message collection here too
            io.to(roomId).emit('receive-message', message);
        });

        // WEBRTC SIGNALING (For Screen Share / Voice)
        socket.on('webrtc-offer', ({ roomId, offer, targetSocketId }) => {
            if (targetSocketId) {
                socket.to(targetSocketId).emit('webrtc-offer', { offer, senderId: socket.id });
            } else {
                socket.to(roomId).emit('webrtc-offer', { offer, senderId: socket.id });
            }
        });

        socket.on('webrtc-answer', ({ answer, targetSocketId }) => {
            socket.to(targetSocketId).emit('webrtc-answer', { answer, senderId: socket.id });
        });

        socket.on('webrtc-ice-candidate', ({ candidate, targetSocketId }) => {
            socket.to(targetSocketId).emit('webrtc-ice-candidate', { candidate, senderId: socket.id });
        });
    });
};
