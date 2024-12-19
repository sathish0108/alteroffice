const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema({
  alias: {
    type: String,
    required: true, 
  },
  ip: {
    type: String,
    required: true, 
  },
  userAgent: {
    family: { type: String, required: true }, 
    device: { type: String, default: "unknown" }, 
  },
  timestamp: {
    type: Date,
    default: Date.now, 
  },
});

module.exports = mongoose.model("Analytics", AnalyticsSchema);
