const mongoose = require("mongoose");

const interactionSchema = new mongoose.Schema({
  alias:
   { 
    type: String,
     required: true 
    },
  timestamp:
   { type: Date,
     default: Date.now 
    },
  ip: 
  { 
    type: String
    
  },
  userAgent:
   {
     type: String 
    },
  location: 
  { 
    type: Object 
  }, 
});

module.exports = mongoose.model("interaction", interactionSchema);
