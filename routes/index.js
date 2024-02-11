const express = require("express");

const router = express.Router();

// controllers
const dev = require("../controllers/dev.controller");
const ruser = require("../controllers/ruser.controller");
const muser = require("../controllers/muser.controller");
const reimbursement = require("../controllers/reimbursement.controller");
const bank = require("../controllers/bank.controller");
const superuser = require("../controllers/superuser.controller");
const barang = require("../controllers/barang.controller");
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
router.post(
  "/reimbursement/status/:id",
  authenticateToken,
  reimbursement.acceptance
);
router.get("/reimbursement/status/:id", reimbursement.get_status);

// Bank
router.get("/bank", bank.getBank);
router.get("/bank/name", bank.getBankAccName);

// M User
router.get("/muser", muser.getUser);

//  Super User
router.post("/superuser", superuser.createUser);
router.get("/superuser", superuser.getUser);
router.get("/superuser/pengajuan", authenticateToken, superuser.get_pengajuan);
router.get("/superuser/user", authenticateToken, superuser.getUserDetail);
router.get(
  "/finance/pengajuan",
  authenticateToken,
  superuser.get_pengajuan_finance
);
router.post(
  "/finance/acceptance/:id",
  authenticateToken,
  reimbursement.finance_acceptance
);

// Barang
router.get("/anakcabang", barang.getAllAnakCabang);
router.get("/anakcabang/detail", barang.getCabangDetail);
router.get("/barang", barang.getBarang);

module.exports = { router };
