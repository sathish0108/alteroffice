const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema({
  alias: {
    type: String,
    required: true, // Refers to the short URL alias
  },
  ip: {
    type: String,
    required: true, // User's IP address for unique user tracking
  },
  userAgent: {
    family: { type: String, required: true }, // OS name
    device: { type: String, default: "unknown" }, // Device type
  },
  timestamp: {
    type: Date,
    default: Date.now, // Date and time of the click
  },
  location: {
    country: { type: String, default: "Unknown" }, // Country (e.g., "US")
    region: { type: String, default: "Unknown" }, // Region (e.g., "California")
    city: { type: String, default: "Unknown" },   // City (e.g., "San Francisco")
  },
});

module.exports = mongoose.model("Analytics", AnalyticsSchema);
