const Analytics = require("../models/Analytics");
const Url = require("../models/shortUrl");


const getClicksByDateForTopic = async (topic) => {
  const past7Days = new Date(new Date().setDate(new Date().getDate() - 7));

  
  const urls = await Url.find({ topic });

  const aliasList = urls.map((url) => url.customAlias); 

  const clicks = await Analytics.aggregate([
    { $match: { alias: { $in: aliasList }, timestamp: { $gte: past7Days } } },
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
const getTotalClicksForTopic = async (topic) => {
  const urls = await Url.find({ topic });
  const aliasList = urls.map((url) => url.customAlias);
  const totalClicks = await Analytics.countDocuments({ alias: { $in: aliasList } });

  const uniqueClicks = await Analytics.distinct("ip", { alias: { $in: aliasList } }).then(
    (ips) => ips.length
  );

  return { totalClicks, uniqueClicks };
};

const getUrlsInTopicAnalytics = async (topic) => {
  const urls = await Url.find({ topic });
  const aliasList = urls.map((url) => url.customAlias);

  const urlAnalytics = await Promise.all(
    aliasList.map(async (alias) => {
      const totalClicks = await Analytics.countDocuments({ alias });
      const uniqueClicks = await Analytics.distinct("ip", { alias }).then((ips) => ips.length);

      return {
        shortUrl: `http://localhost:3000/${alias}`,
        totalClicks,
        uniqueClicks,
      };
    })
  );

  return urlAnalytics;
};

const topic = async (req, res) => {
    const { topic } = req.params;
    try {
      const { totalClicks, uniqueClicks } = await getTotalClicksForTopic(topic);
      const clicksByDate = await getClicksByDateForTopic(topic);
      const urls = await getUrlsInTopicAnalytics(topic);
      res.json({
        totalClicks,
        uniqueClicks,
        clicksByDate,
        urls,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  };

module.exports = {
  getClicksByDateForTopic,
  getTotalClicksForTopic,
  getUrlsInTopicAnalytics,
  topic
};
