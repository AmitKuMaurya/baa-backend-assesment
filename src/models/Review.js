const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  booking_id: { type: Number, required: true, unique: true },
  artist_id: { type: String, required: true },
  client_id: { type: String, required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  created_at: { type: Date, default: Date.now },
});

// Supports: filter by artist, newest first
reviewSchema.index({ artist_id: 1, created_at: -1 });

module.exports = mongoose.model("Review", reviewSchema);