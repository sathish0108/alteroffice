const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const session = require("express-session");
const dotenv = require("dotenv");
const appRoute = require("./routes/route")
// const appRoute = require("./routes/route");
const User =require("./models/User")
dotenv.config();

const app = express();

// Middleware setup
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

const{short} = require("./controller/redirect")
app.get('/:alias', short);

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || "your-jwt-secret");
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         googleId:
 *           type: string
 *           description: Google ID of the user
 *         email:
 *           type: string
 *           description: Email address of the user
 *         name:
 *           type: string
 *           description: Full name of the user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT authentication token
 *         user:
 *           $ref: '#/components/schemas/User'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints
 *   - name: URLs
 *     description: URL shortening operations
 */

/**
 * @swagger
 * /api/auth/login:
 *   get:
 *     summary: Login page
 *     tags: [Authentication]
 *     description: Displays login options including Google OAuth
 *     responses:
 *       200:
 *         description: Login page HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
app.get("/api/auth/login", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Login with Google</h1>
        <a href="/api/auth/google">Click here to login with Google</a>
      </body>
    </html>
  `);
});

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     description: Redirects to Google login page
 *     responses:
 *       302:
 *         description: Redirect to Google authentication
 */
app.get(
  "/api/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);
app.use("/api", appRoute);
/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     description: Handles the Google OAuth callback and returns JWT token
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id,googleId: req.user.googleId, email: req.user.email },
      process.env.JWT_SECRET || "your-jwt-secret",
      { expiresIn: "24h" }
    );
    res.json({ token, user: req.user });
  }
);



// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "URL Shortener API",
      version: "1.0.0",
      description: "API for URL shortening service with Google authentication",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:8000",
        description: "Development server",
      },
    ],
      paths: {
      "/api/shorten": {
        post: {
          summary: "Creates a short URL",
          security: [
            {
              BearerAuth: [],
            },
          ],
          tags: ["URL Shortener"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    longUrl: { type: "string", example: "https://example.com/very-long-url" },
                    topic: { type: "string", example: "activation", enum: ["acquisition", "activation", "retention"] },
                    customAlias: { type: "string", example: "my-custom-alias" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Successfully created a short URL.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      shortUrl: { type: "string", example: "http://localhost:8000/api/shorten/my-custom-alias" },
                      topic: { type: "string", example: "activation" },
                      createdAt: { type: "string", format: "date-time", example: "2024-12-20T15:30:00.000Z" },
                      customAlias: { type: "string", example: "my-custom-alias" },
                    },
                  },
                },
              },
            },
            // other responses...
          },
        },
      },
      "/api/analytics/{alias}": {
        get: {
          summary: "Retrieve analytics data for a shortened URL",
          security: [
            {
              BearerAuth: [],
            },
          ],
          tags: ["URL Analytics"],
          parameters: [
            {
              name: "alias",
              in: "path",
              description: "Alias for the shortened URL",
              required: true,
              schema: {
                type: "string",
                example: "my-custom-alias",
              },
            },
          ],
          responses: {
            200: {
              description: "Analytics data for the shortened URL.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      totalClicks: {
                        type: "number",
                        description: "Total number of clicks for the URL.",
                        example: 120,
                      },
                      uniqueClicks: {
                        type: "number",
                        description: "Number of unique IPs that clicked the URL.",
                        example: 85,
                      },
                      clicksByDate: {
                        type: "array",
                        description: "Clicks categorized by date.",
                        items: {
                          type: "object",
                          properties: {
                            date: {
                              type: "string",
                              format: "date",
                              description: "The date of the clicks.",
                              example: "2024-12-19",
                            },
                            count: {
                              type: "number",
                              description: "Number of clicks on the date.",
                              example: 15,
                            },
                          },
                        },
                      },
                      osType: {
                        type: "object",
                        description: "Click statistics categorized by operating systems.",
                        additionalProperties: {
                          type: "number",
                          description: "Number of clicks from each OS.",
                        },
                        example: {
                          Windows: 50,
                          MacOS: 30,
                          Linux: 20,
                        },
                      },
                      deviceType: {
                        type: "object",
                        description: "Click statistics categorized by device types.",
                        additionalProperties: {
                          type: "number",
                          description: "Number of clicks from each device type.",
                        },
                        example: {
                          Mobile: 80,
                          Desktop: 40,
                        },
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "URL not found.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                        example: "URL not found",
                      },
                    },
                  },
                },
              },
            },
            500: {
              description: "Server error.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                        example: "Server Error",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/overall": {
        get: {
          summary: "Retrieve aggregated analytics data for all shortened URLs",
          security: [
            {
              BearerAuth: [],
            },
          ],
          tags: ["URL Analytics"],
          responses: {
            200: {
              description: "Aggregated analytics data for all shortened URLs.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      totalUrls: {
                        type: "number",
                        description: "Total number of shortened URLs.",
                        example: 150,
                      },
                      totalClicks: {
                        type: "number",
                        description: "Total number of clicks across all URLs.",
                        example: 2500,
                      },
                      uniqueVisitors: {
                        type: "number",
                        description: "Total number of unique visitors across all URLs.",
                        example: 900,
                      },
                      topUrls: {
                        type: "array",
                        description: "List of top-performing URLs by clicks.",
                        items: {
                          type: "object",
                          properties: {
                            alias: {
                              type: "string",
                              description: "Alias of the shortened URL.",
                              example: "top-alias",
                            },
                            longUrl: {
                              type: "string",
                              description: "The original URL.",
                              example: "https://example.com/long-url",
                            },
                            clickCount: {
                              type: "number",
                              description: "Total number of clicks for the URL.",
                              example: 320,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            500: {
              description: "Server error.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                        example: "Server Error",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/topic/{topic}": {
        get: {
          summary: "Retrieve analytics data for a specific topic",
            security: [
            {
              BearerAuth: [],
            },
          ],
          tags: ["URL Analytics"],
          parameters: [
            {
              name: "topic",
              in: "path",
              description: "The topic for which analytics data is to be retrieved.",
              required: true,
              schema: {
                type: "string",
                example: "activation",
              },
            },
          ],
          responses: {
            200: {
              description: "Analytics data for the specified topic.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      totalClicks: {
                        type: "number",
                        description: "Total number of clicks for the topic.",
                        example: 350,
                      },
                      uniqueClicks: {
                        type: "number",
                        description: "Total number of unique visitors for the topic.",
                        example: 120,
                      },
                      clicksByDate: {
                        type: "array",
                        description: "Number of clicks per date for the topic.",
                        items: {
                          type: "object",
                          properties: {
                            date: {
                              type: "string",
                              format: "date",
                              description: "The date of the clicks.",
                              example: "2024-12-20",
                            },
                            count: {
                              type: "number",
                              description: "Number of clicks on the given date.",
                              example: 15,
                            },
                          },
                        },
                      },
                      urls: {
                        type: "array",
                        description: "List of URLs associated with the topic and their analytics.",
                        items: {
                          type: "object",
                          properties: {
                            alias: {
                              type: "string",
                              description: "Alias of the shortened URL.",
                              example: "topic-alias",
                            },
                            longUrl: {
                              type: "string",
                              description: "The original URL.",
                              example: "https://example.com/specific-url",
                            },
                            totalClicks: {
                              type: "number",
                              description: "Total number of clicks for the URL.",
                              example: 45,
                            },
                            uniqueClicks: {
                              type: "number",
                              description: "Number of unique visitors for the URL.",
                              example: 20,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "Topic not found.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                        example: "Topic not found.",
                      },
                    },
                  },
                },
              },
            },
            500: {
              description: "Server error.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                        example: "Server Error",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./server.js","./routes/route.js"], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// app.use("/api", appRoute);
// Passport configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${
        process.env.API_URL || "http://localhost:8000"
      }/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost/urlshortener")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Swagger documentation available at http://localhost:${PORT}/api-docs`
  );
});
