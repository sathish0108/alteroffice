const router = require("express").Router();
const rateLimit = require("express-rate-limit");


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: "Too many requests. Please try again later.",
});

const { shorten} = require("../controller/shorten");


router.post("/shorten",limiter,  shorten);





module.exports = router;
