const express = require("express");

const Url = require("../models/shortUrl");

const Analytics = require("../models/Analytics");
// const Analytics = require("../models/model");
const geoip = require("geoip-lite");
const useragent = require("useragent");

// Redirect and Log Analytics
// const short = async (req, res) => {
//   const { alias } = req.params;
// console.log(alias,"sdcbkab");

//   try {
//     // Find URL by alias
//     const urlData = await Url.findOne({
//       $or: [{ customAlias: alias }, { shortUrl: alias }],
//     });
    
//     if (!urlData) return res.status(404).json({ error: "URL not found" });
    
//     // Log analytics data
//     const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
//     const location = geoip.lookup(ip);
//     const agent = useragent.parse(req.headers["user-agent"]);
    
//     const analyticsData = new RedirectLog({
//         alias: alias,
//         ip,
//         userAgent: agent.toString(),
//         location,
//     });
//     console.log(analyticsData,"ds");

//     await analyticsData.save();

//     // Redirect to original URL
//     res.redirect(urlData.longUrl);
//   } catch (error) {
//     res.status(500).json({ error: "Server Error" });
//   }
// };

// When logging analytics data in the short URL controller:
const short = async (req, res) => {
    const { alias } = req.params;
    console.log("Received alias:", alias); // Log the alias for debugging
  
    try {
      // Find URL by alias
      const urlData = await Url.findOne({
        $or: [{ customAlias: alias }, { shortUrl: alias }],
      });
  
      if (!urlData) return res.status(404).json({ error: "URL not found" });
  
      // Log analytics data
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const location = geoip.lookup(ip); // Get location from the IP address
  console.log(location,"sdn");
  
      // Parse the User-Agent string using the 'useragent' module
      const agent = useragent.parse(req.headers["user-agent"]);
  
      // Prepare userAgent object to store in the database
      const userAgentData = {
        family: agent.os.family || "Unknown",  // Use 'Unknown' if the family is missing
        device: agent.device.family || "Unknown",  // Use 'Unknown' if the device is missing
      };
  
      // Prepare the location data from geoip lookup
      const locationData = {
        country: location ? location.country || "Unknown" : "Unknown",
        region: location ? location.region || "Unknown" : "Unknown",
        city: location ? location.city || "Unknown" : "Unknown",
      };
  
      // Prepare analytics data
      const analyticsData = new Analytics({
        alias,
        ip,
        userAgent: userAgentData,  // Save parsed user agent data
        location: locationData,    // Save location data
      });
  
      console.log("Analytics data:", analyticsData);  // For debugging
  
      // Save analytics data to the database
      await analyticsData.save();
  
      // Redirect to the original long URL
      res.redirect(urlData.longUrl);
    } catch (error) {
      console.error("Error:", error);  // Log any errors
      res.status(500).json({ error: "Server Error" });
    }
  };

  
module.exports = {
    short
   };
