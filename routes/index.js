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
const pengumuman = require("../controllers/pengumuman.controller");
const dept = require("../controllers/dept.controller");
const coa = require("../controllers/coa.controller");
const suplier = require("../controllers/suplier.controller");
const { authenticateToken } = require("../utils/jwt");

// routes

// Dev
router.use("/dev", dev.create);
router.get("/devs", dev.getDevs);

// Dept
router.post("/dept", dept.create);
router.get("/dept", dept.get);
router.delete("/dept/:id", dept.delete);

// User
router.post("/user/login", ruser.login);
router.post("/user/complete", authenticateToken, ruser.completeUser);
router.post("/user/update-password", authenticateToken, ruser.updatePw);
router.post("/user/logout", authenticateToken, ruser.logout);

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
router.get("/reimbursement/:id", authenticateToken, reimbursement.get_detail);
router.delete(
  "/reimbursement/:id",
  authenticateToken,
  reimbursement.cancel_upload
);

// Bank
router.get("/bank", bank.getBank);
router.get("/bank/name", bank.getBankAccName);

// M User
router.get("/muser", muser.getUser);

//  Super User
router.post("/superuser", superuser.createUser);
router.get("/superuser", superuser.getUser);
router.get("/superuser/userlist", superuser.getAllUsers);
router.get("/superuser/pengajuan", authenticateToken, superuser.get_pengajuan);
router.get("/superuser/user", authenticateToken, superuser.getUserDetail);
router.get("/superuser/reimbursement", reimbursement.get_super_reimbursement);
router.get(
  "/superuser/reimbursement/report",
  reimbursement.get_super_reimbursement_report
);
router.get("/superuser/barang", barang.getAllRequestBarangAdmin);

// finance
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
router.delete("/superuser/delete/:iduser", superuser.deleteAdmin);
router.post(
  "/finance/update-coa/:id",
  authenticateToken,
  reimbursement.finance_update_coa
);

// Barang
router.get("/anakcabang", barang.getAllAnakCabang);
router.get("/anakcabang/detail", barang.getCabangDetail);
router.get("/barang", barang.getBarang);
router.post("/barang/create", authenticateToken, barang.createTrxPermintaan);
router.get("/barang/requested", authenticateToken, barang.getAllRequestBarang);
router.get("/barang/requested/detail", barang.getDetailPermintaan);

// Pengumuman
router.post("/pengumuman", authenticateToken, pengumuman.createPengumuman);
router.get("/pengumuman", authenticateToken, pengumuman.getPengumuman);
router.delete(
  "/pengumuman/:pid",
  authenticateToken,
  pengumuman.deletePengumuman
);
router.get(
  "/pengumuman/count",
  authenticateToken,
  pengumuman.getPengumumanCount
);
router.post(
  "/pengumuman/read/:id",
  authenticateToken,
  pengumuman.readPengumuman
);

// COA
router.get("/coa", coa.getCOA);
router.delete("/coa/:id", coa.deleteCOA);
router.post("/coa/:id", coa.updatecreateCOA);

// Suplier
router.get("/suplier", suplier.getSuplier);
router.get("/suplier/:kdsp", suplier.getSuplierDetail);

module.exports = { router };
