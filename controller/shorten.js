const express = require("express");
const router = express.Router();
const shortid = require("shortid");
// const rateLimit = require("express-rate-limit");
const Url = require("../models/shortUrl");
const User =require("../models/User")


// Create Short URL
// const shorten = async (req, res) => {
//   const { longUrl, customAlias, topic } = req.body;

//   if (!longUrl) return res.status(400).json({ error: "longUrl is required" });

//   try {
//     let shortUrl;

//     // Check for custom alias
//     if (customAlias) {
//       const existing = await Url.findOne({ customAlias });
//       if (existing) return res.status(400).json({ error: "Alias already taken" });

//       shortUrl = customAlias;
//     } else {
//       shortUrl = shortid.generate(); // Generate a unique short URL
//     }

//     // Save to MongoDB
//     const urlData = new Url({
//       longUrl,
//       shortUrl,
//       customAlias: customAlias || null,
//       topic,
//     });

//     await urlData.save();

//     res.status(201).json({
//       shortUrl: `http://localhost:8000/api/shorten/${shortUrl}`,
//       createdAt: urlData.createdAt,
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Server Error" });
//   }
// };

const shorten = async (req, res) => {
  const { longUrl, topic, customAlias } = req.body;
  const { googleId } = req.user; // Extract googleId from the authenticated user

  // Validate longUrl
  if (!longUrl) {
    return res.status(400).json({ error: "longUrl is required" });
  }

  try {
    console.log(googleId, "googleId being queried");

    // Retrieve the user by Google ID
    const user = await User.findOne({ googleId });
    console.log(user.googleId, "user found in database");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let shortUrl;

    // Handle custom alias
    if (customAlias) {
      const existing = await Url.findOne({ customAlias });
      if (existing) {
        return res.status(400).json({ error: "Alias already taken" });
      }
      shortUrl = customAlias;
    } else {
      // Generate a unique short URL
      let isUnique = false;
      while (!isUnique) {
        shortUrl = shortid.generate();
        const existingShortUrl = await Url.findOne({ shortUrl });
        if (!existingShortUrl) {
          isUnique = true;
        }
      }
    }

    console.log(shortUrl, "Generated short URL");

    const validTopics = ["acquisition", "activation", "retention"];
    if (topic && !validTopics.includes(topic)) {
      return res.status(400).json({
        error: `Invalid topic. Allowed values: ${validTopics.join(", ")}`,
      });
    }

    // Save the new URL data in MongoDB
   // In your shorten controller
const urlData = new Url({
  longUrl,
  shortUrl,
  shortCode: shortUrl, // Add this line
  customAlias: customAlias || null,
  topic: topic || "general",
  createdBy: user.googleId,
});

    console.log(urlData);

    await urlData.save();

    res.status(201).json({
      shortUrl: `http://localhost:8000/${shortUrl}`,
      topic: urlData.topic,
      createdAt: urlData.createdAt,
      customAlias: urlData.customAlias,
      createdBy: user.googleId, // Include ObjectId in the response
    });
  } catch (error) {
    console.error("Error shortening URL:", error);
    res.status(500).json({ error: "Server Error" });
  }
};


module.exports = {
   shorten
  };
