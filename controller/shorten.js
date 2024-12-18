const express = require("express");
const router = express.Router();
const shortid = require("shortid");

const Url = require("../models/shortUrl");


//post api to create url
const shorten = async (req, res) => {
  const { longUrl, customAlias, topic } = req.body;
//validate
  if (!longUrl) {
    return res.status(400).json({ error: "longUrl is required" });
  }

  try {
    let shortUrl;
    if (customAlias) {
      const existing = await Url.findOne({ customAlias });
      if (existing) {
        return res.status(400).json({ error: "Alias already taken" });
      }
      shortUrl = customAlias;
    } else {
      shortUrl = shortid.generate(); 
    }

    const validTopics = ["acquisition", "activation", "retention"];
    if (topic && !validTopics.includes(topic)) {
      return res.status(400).json({ error: `Invalid topic. Allowed values: ${validTopics.join(", ")}` });
    }

    const urlData = new Url({
      longUrl,
      shortUrl,
      customAlias: customAlias || null,
      topic: topic || "general", 
    });

    await urlData.save();

    
    res.status(201).json({
      shortUrl: `http://localhost:8000/api/shorten/${shortUrl}`,
      topic: urlData.topic,
      createdAt: urlData.createdAt,
    });
  } catch (error) {
    console.error("Error shortening URL:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
   shorten
  };
