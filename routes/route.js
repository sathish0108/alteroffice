const router = require("express").Router();
const rateLimit = require("express-rate-limit");


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: "Too many requests. Please try again later.",
});

const { shorten} = require("../controller/shorten");
const{short} = require("../controller/redirect")
const{analytics} =require("../controller/analytics")
const{topic} =require("../controller/topic")
const{overall} =require("../controller/overall")

router.post("/shorten",limiter,  shorten);
router.get('/shorten/:alias', short);
router.get('/analytics/:alias', analytics);
router.get('/topic/:topic', topic);
router.get('/overall', overall);

module.exports = router;
