const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const authenticateJWT = require('../middleware/authenticate');


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: "Too many requests. Please try again later.",
});

const { shorten} = require("../controller/shorten");
// const{short} = require("../controller/redirect")
const{analytics} =require("../controller/analytics")
const{topic} =require("../controller/topic")
const{overall} =require("../controller/overall")
// const { register, login } = require('../controller/register');
// const {googleAuth,callBack,protected} = require("../controller/registerswag")
// router.post('/register', register);
// router.post('/login', login);
router.post("/shorten",authenticateJWT, limiter, shorten);
// router.get('/:alias', short);
router.get('/analytics/:alias',authenticateJWT, analytics);
router.get('/topic/:topic',authenticateJWT, topic);
router.get('/overall',authenticateJWT, overall);
// router.get("/auth/google", googleAuth); // Google Auth endpoint
// router.get("/auth/google/callback", callBack); // Google Auth callback endpoint
// router.get("/protected", protected); // Protected route


module.exports = router;
