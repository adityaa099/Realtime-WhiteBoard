const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getRooms, getWhiteboardHistory, deleteRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createRoom)
    .get(protect, getRooms);

router.post('/join/:roomId', protect, joinRoom);
router.get('/history/:roomId', protect, getWhiteboardHistory);
router.delete('/:roomId', protect, deleteRoom);

module.exports = router;
