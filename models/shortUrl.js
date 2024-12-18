const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  longUrl:
   { 
    type: String,
    required: true
     },
  shortUrl: 
    { 
     type: String,
     required: true, 
     unique: true
     },
  customAlias:
   { 
    type: String,
    unique: true
   },
  topic: 
  { 
    type: String, 
    default: "general" 
  },
  createdAt:
   { 
    type: Date, 
    default: Date.now 
  },
});

module.exports = mongoose.model("Url", urlSchema);
