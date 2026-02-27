const mongoose = require('mongoose');

const whiteboardDataSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    history: { type: Array, default: [] }, // Array of drawing actions
    snapshot: { type: String } // Base64 image snapshot for quicker loading
}, { timestamps: true });

module.exports = mongoose.model('WhiteboardData', whiteboardDataSchema);
