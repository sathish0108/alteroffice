const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const verifyGoogleToken = async (token) => {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    return ticket.getPayload();
  };
  
  
  const register = async (req, res) => {
    const { token } = req.body; 
    console.log(token, "Google Token Received");
  
    try {
    
      const userData = await verifyGoogleToken(token);
  
     
      let user = await User.findOne({ googleId: userData.sub });
  
      if (!user) {
        
        user = new User({
          googleId: userData.sub,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
        });
  
        await user.save();
      }
  
    
      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
  
      res.json({
        message: 'User authenticated successfully',
        token: jwtToken, 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server Error' });
    }
  };
  
// User Login (Google Sign-In)
const login = async (req, res) => {
    const { token } = req.body; 
    console.log(token, "Google Token Received");
  
    try {
     
      const userData = await verifyGoogleToken(token);
  
      
      const user = await User.findOne({ googleId: userData.sub });
  
      if (!user) {
       
        return res.status(404).json({ error: 'User not found. Please register first.' });
      }
  
    
      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
  
      res.json({
        message: 'User logged in successfully',
        token: jwtToken,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server Error' });
    }
  };
  

module.exports = { register, login };
