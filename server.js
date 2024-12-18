require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const appRoute = require("./routes/route");
// const https = require("https");
// const fs = require("fs");

const PORT = process.env.PORT || 8000;

// connect to mongodb
const url = process.env.MONGODB_URI;
const conDB = async () => {
  try {
    const connectDB = await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 60000,
    });
    if (connectDB) {
      console.log("connected to the database");
    } else {
      console.log((error) => error);
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};
conDB();

const app = express();
const cors = require("cors");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());


app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
// var corsOptions = {
//   origin: "http://localhost",
//   optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
// };
// app.use(cors(corsOptions));
app.use(cors());
app.get("/", (req, res) => {
  res.render("index");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", appRoute);
// const httpsServer = https.createServer(options, app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
