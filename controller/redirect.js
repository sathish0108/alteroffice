const express = require("express");

const Url = require("../models/shortUrl");
const Analytics = require("../models/model");
const geoip = require("geoip-lite");
const useragent = require("useragent");


const short = async (req, res) => {
  const { alias } = req.params;
console.log(alias,"sdcbkab");

  try {   
    const urlData = await Url.findOne({
      $or: [{ customAlias: alias }, { shortUrl: alias }],
    });

    if (!urlData) return res.status(404).json({ error: "URL not found" });
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const location = geoip.lookup(ip);
    const agent = useragent.parse(req.headers["user-agent"]);

    const analyticsData = new Analytics({
      alias: alias,
      ip,
      userAgent: agent.toString(),
      location,
    });

    await analyticsData.save();

    
    res.redirect(urlData.longUrl);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
    short
   };
