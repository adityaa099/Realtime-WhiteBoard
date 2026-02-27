const Room = require('../models/Room');
const WhiteboardData = require('../models/WhiteboardData');
const { v4: uuidv4 } = require('uuid');

// @desc    Create a new room
// @route   POST /api/rooms/create
// @access  Private
const createRoom = async (req, res) => {
    try {
        const { name, isPublic } = req.body;
        const roomId = uuidv4();

        const room = await Room.create({
            roomId,
            name: name || `Room-${roomId.substring(0, 6)}`,
            hostId: req.user._id,
            participants: [req.user._id],
            isPublic: isPublic !== undefined ? isPublic : true
        });

        // Initialize whiteboard data for the room
        await WhiteboardData.create({
            roomId,
            history: [],
            snapshot: null
        });

        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Join an existing room
// @route   POST /api/rooms/join/:roomId
// @access  Private
const joinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Add user to participants if not already there
        if (!room.participants.includes(req.user._id)) {
            room.participants.push(req.user._id);
            await room.save();
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get room details without joining
// @route   GET /api/rooms/:roomId
// @access  Private
const getRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all active/public rooms
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ isPublic: true })
            .populate('hostId', 'username')
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get Whiteboard History for a room
// @route   GET /api/rooms/history/:roomId
// @access  Private
const getWhiteboardHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        // ensure user has access to room
        const room = await Room.findOne({ roomId });
        if (!room || !room.participants.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to view this room' });
        }

        const data = await WhiteboardData.findOne({ roomId });
        if (!data) {
            return res.status(404).json({ message: 'Whiteboard data not found' });
        }

        res.status(200).json({ history: data.history, snapshot: data.snapshot });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a room (host only)
// @route   DELETE /api/rooms/:roomId
// @access  Private
const deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Only the host can delete
        if (room.hostId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the host can delete this room' });
        }

        await Room.deleteOne({ roomId });
        await WhiteboardData.deleteOne({ roomId });

        res.status(200).json({ message: 'Room deleted successfully', roomId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


module.exports = {
    createRoom,
    joinRoom,
    getRoom,
    getRooms,
    getWhiteboardHistory,
    deleteRoom
};
