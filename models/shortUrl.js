const mongoose = require("mongoose");



const urlSchema = new mongoose.Schema({
  longUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  shortCode: { type: String, required: true, unique: true }, // Add this
  customAlias: { type: String, sparse: true, unique: true },
  topic: { type: String, default: 'general' },
  createdBy: { type: String, required: true }
});

module.exports = mongoose.model("Url", urlSchema);
