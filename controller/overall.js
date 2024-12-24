const Analytics = require("../models/Analytics");
const Url = require("../models/shortUrl");

// Get Total, Unique Clicks, and Clicks by Date for All User URLs
const getOverallAnalytics = async (googleId) => {
  // Get URLs only for authenticated user
  const urls = await Url.find({ createdBy: googleId });
  const aliasList = urls.map((url) => url.shortUrl);
 
  // Total clicks
  const totalClicks = await Analytics.aggregate([
    { $match: { alias: { $in: aliasList } } },
    {
      $lookup: {
        from: "urls",
        localField: "alias", 
        foreignField: "shortUrl",
        as: "url"
      }
    },
    { $match: { "url.createdBy": googleId } },
    { $count: "total" }
  ]).then(result => result[0]?.total || 0);
 
  // Unique clicks
  const uniqueClicks = await Analytics.aggregate([
    { $match: { alias: { $in: aliasList } } },
    {
      $lookup: {
        from: "urls",
        localField: "alias",
        foreignField: "shortUrl", 
        as: "url"
      }
    },
    { $match: { "url.createdBy": googleId } },
    { $group: { _id: "$ip" } },
    { $count: "total" }
  ]).then(result => result[0]?.total || 0);
 
  // Clicks by date
  const clicksByDate = await Analytics.aggregate([
    { 
      $match: { 
        alias: { $in: aliasList },
        timestamp: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
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
    { $match: { "url.createdBy": googleId } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
 
  // OS analytics
  const osType = await Analytics.aggregate([
    { $match: { alias: { $in: aliasList } } },
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
        _id: "$userAgent.family",
        uniqueClicks: { $sum: 1 },
        uniqueUsers: { $addToSet: "$ip" }
      }
    }
  ]);
 
  // Device analytics  
  const deviceType = await Analytics.aggregate([
    { $match: { alias: { $in: aliasList } } },
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
  ]);
 
  return {
    totalUrls: urls.length,
    totalClicks,
    uniqueClicks, 
    clicksByDate,
    osType,
    deviceType
  };
 };
 
 const overall = async (req, res) => {
  const { googleId } = req.user;
  
  try {
    const analytics = await getOverallAnalytics(googleId);
    res.json(analytics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
 };


module.exports = { getOverallAnalytics,overall };
