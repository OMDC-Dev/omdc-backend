const express = require("express");

const router = express.Router();

// controllers
const dev = require("../controllers/dev.controller");
const ruser = require("../controllers/ruser.controller");
const muser = require("../controllers/muser.controller");
const reimbursement = require("../controllers/reimbursement.controller");
const bank = require("../controllers/bank.controller");
const { authenticateToken } = require("../utils/jwt");

// routes

// Dev
router.use("/dev", dev.create);
router.get("/devs", dev.getDevs);

// User
router.post("/user/login", ruser.login);
router.post("/user/complete", authenticateToken, ruser.completeUser);

// Reimbursement
router.get("/cabang", reimbursement.cabang);
router.post("/reimbursement", authenticateToken, reimbursement.reimbursement);
router.get(
  "/reimbursement",
  authenticateToken,
  reimbursement.get_reimbursement
);

// Bank
router.get("/bank", bank.getBank);
router.get("/bank/name", bank.getBankAccName);

// M User
router.get("/muser", muser.getUser);

module.exports = { router };
