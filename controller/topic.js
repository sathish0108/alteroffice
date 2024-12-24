const Analytics = require("../models/Analytics");
const Url = require("../models/shortUrl");

const getClicksByDateForTopic = async (topic, googleId) => {
  const past7Days = new Date(new Date().setDate(new Date().getDate() - 7));
  const urls = await Url.find({ topic, createdBy: googleId });
  const aliasList = urls.map(url => url.shortUrl);
 
  return Analytics.aggregate([
    { $match: { alias: { $in: aliasList }, timestamp: { $gte: past7Days } } },
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
  ]).then(clicks => clicks.map(item => ({ 
    date: item._id, 
    clickCount: item.count 
  })));
 };
 
 const getTotalClicksForTopic = async (topic, googleId) => {
  const urls = await Url.find({ topic, createdBy: googleId });
  const aliasList = urls.map(url => url.shortUrl);
 
  const [totalClicks, uniqueClicks] = await Promise.all([
    Analytics.aggregate([
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
    ]).then(result => result[0]?.total || 0),
 
    Analytics.aggregate([
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
    ]).then(result => result[0]?.total || 0)
  ]);
 
  return { totalClicks, uniqueClicks };
 };
 

 const getUrlsInTopicAnalytics = async (topic, googleId) => {
 // Find URLs for specific topic and user
 const urls = await Url.find({ topic, createdBy: googleId });
 const aliasList = urls.map(url => url.shortUrl);

 const urlAnalytics = await Promise.all(
   aliasList.map(async (alias) => {
     // Get analytics with user verification
     const [totalClicks, uniqueClicks] = await Promise.all([
       Analytics.aggregate([
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
         { $count: "total" }
       ]).then(result => result[0]?.total || 0),

       Analytics.aggregate([
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
         { $group: { _id: "$ip" } },
         { $count: "total" }
       ]).then(result => result[0]?.total || 0)
     ]);

     return {
       shortUrl: `http://localhost:8000/api/shorten/${alias}`,
       totalClicks,
       uniqueClicks
     };
   })
 );

 return urlAnalytics;
};


const topic = async (req, res) => {
  const { topic } = req.params;
  const { googleId } = req.user;

  try {
    // Get all analytics in parallel
    const [
      clickStats,
      clicksByDate,
      urlsAnalytics
    ] = await Promise.all([
      getTotalClicksForTopic(topic, googleId),
      getClicksByDateForTopic(topic, googleId),
      getUrlsInTopicAnalytics(topic, googleId)
    ]);

    res.json({
      ...clickStats,
      clicksByDate,
      urls: urlsAnalytics
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
