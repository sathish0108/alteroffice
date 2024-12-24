const Analytics = require("../models/Analytics");
const Url = require("../models/shortUrl");

// Helper Functions
const getClicksByDate = async (alias, googleId) => {
  const past7Days = new Date(new Date().setDate(new Date().getDate() - 7));
  
  return await Analytics.aggregate([
    {
      $match: { 
        alias,
        timestamp: { $gte: past7Days } 
      }
    },
    {
      $lookup: {
        from: "urls",
        localField: "alias",
        foreignField: "shortUrl",
        as: "url"
      }
    },
    {
      $match: { "url.createdBy": googleId }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]).then(clicks => clicks.map(item => ({ 
    date: item._id, 
    clickCount: item.count 
  })));
};

// Apply similar pattern to other helper functions
const getClicksByOS = async (alias, googleId) => {
  return await Analytics.aggregate([
    { $match: { alias } },
    {
      $lookup: {
        from: "urls",
        localField: "alias",
        foreignField: "shortUrl",
        as: "url"
      }
    },
    { $match: { "url.createdBy": googleId } },
    {
      $group: {
        _id: { $ifNull: ["$userAgent.family", "Unknown"] },
        uniqueClicks: { $sum: 1 },
        uniqueUsers: { $addToSet: "$ip" }
      }
    }
  ]).then(clicks => clicks.map(item => ({
    osName: item._id,
    uniqueClicks: item.uniqueClicks,
    uniqueUsers: item.uniqueUsers.length
  })));
};
const getClicksByDevice = async (alias, googleId) => {
  return await Analytics.aggregate([
    { $match: { alias } },
    {
      $lookup: {
        from: "urls",
        localField: "alias",
        foreignField: "shortUrl",
        as: "url"
      }
    },
    { $match: { "url.createdBy": googleId } },
    {
      $group: {
        _id: "$userAgent.device",
        uniqueClicks: { $sum: 1 },
        uniqueUsers: { $addToSet: "$ip" }
      }
    }
  ]).then(clicks => clicks.map(item => ({
    deviceName: item._id || "Unknown",
    uniqueClicks: item.uniqueClicks,
    uniqueUsers: item.uniqueUsers.length
  })));
};

const getClicksByLocation = async (alias, googleId) => {
  return await Analytics.aggregate([
    { $match: { alias } },
    {
      $lookup: {
        from: "urls", 
        localField: "alias",
        foreignField: "shortUrl",
        as: "url"
      }
    },
    { $match: { "url.createdBy": googleId } },
    {
      $group: {
        _id: {
          country: { $ifNull: ["$location.country", "Unknown"] },
          region: { $ifNull: ["$location.region", "Unknown"] },
          city: { $ifNull: ["$location.city", "Unknown"] }
        },
        uniqueClicks: { $sum: 1 },
        uniqueUsers: { $addToSet: "$ip" }
      }
    }
  ]).then(clicks => clicks.map(item => ({
    country: item._id.country,
    region: item._id.region, 
    city: item._id.city,
    uniqueClicks: item.uniqueClicks,
    uniqueUsers: item.uniqueUsers.length
  })));
 };


 
// Update the main analytics function
const analytics = async (req, res) => {
  const { alias } = req.params;
  const { googleId } = req.user;

  try {
    // First verify if the URL belongs to the user
    const urlExists = await Url.findOne({ shortUrl: alias, createdBy: googleId });
    if (!urlExists) {
      return res.status(403).json({ error: "Unauthorized access to this URL" });
    }

    const [
      totalClicks,
      uniqueClicks,
      clicksByDate,
      osAnalytics,
      deviceAnalytics,
      locationAnalytics
    ] = await Promise.all([
      // Simplified total clicks query
      Analytics.countDocuments({ alias }),
      
      // Simplified unique clicks query
      Analytics.distinct("ip", { alias }).then(ips => ips.length),

      getClicksByDate(alias, googleId),
      getClicksByOS(alias, googleId),
      getClicksByDevice(alias, googleId),
      getClicksByLocation(alias, googleId)
    ]);

    res.json({
      totalClicks,
      uniqueClicks,
      clicksByDate,
      osType: osAnalytics,
      deviceType: deviceAnalytics,
      location: locationAnalytics
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = { analytics };
