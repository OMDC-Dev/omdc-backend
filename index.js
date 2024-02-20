const express = require("express");
const cors = require("cors");
const { router } = require("./routes");
const db = require("./db");
const db_user = require("./db/user.db");

const app = express();

var corsOptions = {
  origin: "http://localhost:5173",
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json({ limit: "1mb" }));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.set("trust proxy", true);
app.disable("etag");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, OPTION, DELETE"
  );
  next();
});

// DATABASE
db.sequelize
  .sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// sync user db
db_user.sequelize
  .sync()
  .then(() => {
    console.log("Synced user db.");
  })
  .catch((err) => {
    console.log("Failed to sync user db: " + err.message);
  });

// router
app.use(router);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Reimbursement Apps" });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port localhost:${PORT}.`);
});
