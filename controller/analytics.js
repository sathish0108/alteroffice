const Analytics = require("../models/Analytics");
const getClicksByDate = async (alias) => {
  const past7Days = new Date(new Date().setDate(new Date().getDate() - 7));

  const clicks = await Analytics.aggregate([
    { $match: { alias, timestamp: { $gte: past7Days } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return clicks.map((item) => ({ date: item._id, clickCount: item.count }));
};

const getClicksByOS = async (alias) => {
  const clicks = await Analytics.aggregate([
    { $match: { alias } },
    {
      $group: {
        _id: "$userAgent.family",
        uniqueClicks: { $sum: 1 },
        uniqueUsers: { $addToSet: "$ip" },
      },
    },
  ]);

  return clicks.map((item) => ({
    osName: item._id,
    uniqueClicks: item.uniqueClicks,
    uniqueUsers: item.uniqueUsers.length,
  }));
};

const getClicksByDevice = async (alias) => {
  const clicks = await Analytics.aggregate([
    { $match: { alias } },
    {
      $group: {
        _id: "$userAgent.device",
        uniqueClicks: { $sum: 1 },
        uniqueUsers: { $addToSet: "$ip" },
      },
    },
  ]);

  return clicks.map((item) => ({
    deviceName: item._id || "Unknown",
    uniqueClicks: item.uniqueClicks,
    uniqueUsers: item.uniqueUsers.length,
  }));
};

const analytics = async (req, res) => {
    const { alias } = req.params;
  
    try {
      const totalClicks = await Analytics.countDocuments({ alias });

      const uniqueClicks = await Analytics.distinct("ip", { alias }).then(
        (ips) => ips.length
      );

      const clicksByDate = await getClicksByDate(alias);
      const osAnalytics = await getClicksByOS(alias);
      const deviceAnalytics = await getClicksByDevice(alias);
  
      res.json({
        totalClicks,
        uniqueClicks,
        clicksByDate,
        osType: osAnalytics,
        deviceType: deviceAnalytics,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  };

module.exports = { getClicksByDate, getClicksByOS, getClicksByDevice,analytics };
