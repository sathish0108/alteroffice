const Analytics = require("../models/Analytics");
const Url = require("../models//shortUrl");

const getOverallAnalytics = async () => {
  const urls = await Url.find( );
  const aliasList = urls.map((url) => url.customAlias); 
  const totalClicks = await Analytics.countDocuments({ alias: { $in: aliasList } });

 
  const uniqueClicks = await Analytics.distinct("ip", { alias: { $in: aliasList } }).then(
    (ips) => ips.length
  );

  const clicksByDate = await Analytics.aggregate([
    { $match: { alias: { $in: aliasList }, timestamp: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  
  const osType = await Analytics.aggregate([
    { $match: { alias: { $in: aliasList } } },
    {
      $group: {
        _id: "$userAgent.family", 
        uniqueClicks: { $sum: 1 },
        uniqueUsers: { $addToSet: "$ip" },
      },
    },
  ]);

  const deviceType = await Analytics.aggregate([
    { $match: { alias: { $in: aliasList } } },
    {
      $group: {
        _id: "$userAgent.device", 
        uniqueClicks: { $sum: 1 },
        uniqueUsers: { $addToSet: "$ip" },
      },
    },
  ]);

  return {
    totalUrls: urls.length,
    totalClicks,
    uniqueClicks,
    clicksByDate,
    osType,
    deviceType,
  };
};

const overall = async (req, res) => {
    try {
      const analytics = await getOverallAnalytics();
  
      res.json(analytics);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  };

module.exports = { getOverallAnalytics,overall };
