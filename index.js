const express = require("express");
const cors = require("cors");
const { router } = require("./routes");
const db = require("./db");
const db_user = require("./db/user.db");

// import firebase-admin package
const admin = require("firebase-admin");

// import service account file (helps to know the firebase project details)
const serviceAccount = require("./config/serviceAccountKey.json");

const app = express();

// var corsOptions = {
//   origin: "http://localhost:5173",
// };

// Intialize the firebase-admin project/account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());

// Fixing "413 Request Entity Too Large" errors
app.use(express.json({ limit: "50mb", extended: true }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);

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
  res.json({ message: "Reimbursement Apps Service v.0.9.3 - rev 2" });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port localhost:${PORT}.`);
});
