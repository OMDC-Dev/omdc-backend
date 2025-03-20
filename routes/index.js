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
const icon = require("../controllers/icon.controller");
const maker = require("../controllers/maker.controller");
const adminpb = require("../controllers/adminpb.controller");
const grup = require("../controllers/v4/grup.controller");
const kategory = require("../controllers/v4/kategory.controller");
const kemasan = require("../controllers/v4/kemasan.controller");
const satuan = require("../controllers/v4/satuan.controller");
const masterbarang = require("../controllers/v4/masterbarang.controller");
const invoice = require("../controllers/v4/invoice.controller");
const workplan = require("../controllers/workplan/workplan.controller");
const workplanprogress = require("../controllers/workplan/workplanProgress.controller");
const workplancomment = require("../controllers/workplan/workplanComment.controller");
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
router.post("/user/complete/:id", ruser.completeUser);
router.post("/user/update-password", ruser.updatePw);
router.post("/user/logout", ruser.logout);
router.get("/user/kodeakses/:iduser", ruser.get_kodeakses_by_id);
router.get("/user/status/:iduser", ruser.get_status_user);
router.get("/user/session/:iduser", ruser.get_user_session_by_id);

// Reimbursement
router.get("/cabang", reimbursement.cabang);
router.post("/reimbursement", reimbursement.reimbursement);
router.get("/reimbursement", reimbursement.get_reimbursement);
router.post("/reimbursement/status/:id", reimbursement.acceptance);
router.post("/reimbursement/status-multi", reimbursement.acceptance_multi);
router.post("/reimbursement/extra/:id", reimbursement.acceptExtraReimbursement);
router.get("/reimbursement/status/:id", reimbursement.get_status);
router.get("/reimbursement/:id", reimbursement.get_detail);
router.delete("/reimbursement/:id", reimbursement.cancel_upload);
router.post("/reimbursement/update-admin/:id", reimbursement.change_admin);
router.post(
  "/reimbursement/reupload-file/:id",
  reimbursement.reupload_attachment
);
router.post(
  "/reimbursement/reupload",
  reimbursement.reupload_by_doc_attachment
);
router.get("/reviewer/remarked", reimbursement.get_reimbursement_remark);
router.post(
  "/reviewer/remarked/check/:id",
  reimbursement.reviewer_check_remark
);

// Bank
router.get("/bank", bank.getBank);
router.get("/bank/name", bank.getBankAccName);

// M User
router.get("/muser", muser.getUser);
router.post("/muser/update-status/:nik", muser.update_userstatus_by_nik);

//  Super User
router.post("/superuser", superuser.createUser);
router.get("/superuser", superuser.getUser);
router.get("/superuser/userlist", superuser.getAllUsers);
router.get("/superuser/pengajuan", superuser.get_pengajuan);
router.get("/superuser/user", superuser.getUserDetail);
router.get("/superuser/reimbursement", reimbursement.get_super_reimbursement);
router.get(
  "/superuser/reimbursement/report",
  reimbursement.get_super_reimbursement_report
);
router.get("/superuser/barang", barang.getAllRequestBarangAdmin);

// Reviewer
router.get("/reviewer/reimbursement", reimbursement.get_review_reimbursement);
router.post(
  "/reviewer/accept/:id",
  reimbursement.acceptReviewReimbursementData
);
router.post(
  "/reviewer/accept-multi",
  reimbursement.acceptReviewReimbursementDataMulti
);

// Maker
router.get("/maker/reimbursement", maker.get_reimbursement);
router.post("/maker/accept/:id", maker.acceptMakerReimbursement);

// finance
router.get("/finance/pengajuan", superuser.get_pengajuan_finance);
router.post("/finance/acceptance/:id", reimbursement.finance_acceptance);
router.post(
  "/finance/acceptance-multi",
  reimbursement.finance_acceptance_multi
);
router.delete("/superuser/delete/:iduser", superuser.deleteAdmin);
router.post("/finance/update-coa/:id", reimbursement.finance_update_coa);

// Barang
router.get("/anakcabang", barang.getAllAnakCabang);
router.get("/anakcabang/detail", barang.getCabangDetail);
router.get("/barang", barang.getBarang);
router.post("/barang/create", barang.createTrxPermintaan);
router.get("/barang/requested", barang.getAllRequestBarang);
router.get("/barang/requested/detail", barang.getDetailPermintaan);
router.post("/barang/admin-approval/:idpb/:mode", barang.admin_approval);
router.delete("/barang/:idpb", barang.cance_pengajuan);
router.post("/barang/update-request", barang.update_trx_brg);
router.post("/barang/reject-request", barang.reject_trx_brg);

// Pengumuman
router.post("/pengumuman", pengumuman.createPengumuman);
router.get("/pengumuman", pengumuman.getPengumuman);
router.delete(
  "/pengumuman/:pid",

  pengumuman.deletePengumuman
);
router.get(
  "/pengumuman/count",

  pengumuman.getPengumumanCount
);
router.post(
  "/pengumuman/read/:id",

  pengumuman.readPengumuman
);

// COA
router.get("/coa", coa.getCOA);
router.delete("/coa/:id", coa.deleteCOA);
router.post("/coa/:id", coa.updatecreateCOA);

// Suplier
router.get("/suplier", suplier.getSuplier);
router.get("/suplier/:kdsp", suplier.getSuplierDetail);

// Icon
router.get("/icon", icon.getIcon);
router.post("/updateIcon", icon.updateIcon);

// Admin PB
router.post("/adminpb/:iduser", adminpb.add_admin);
router.delete("/adminpb/:iduser", adminpb.delete_admin);
router.get("/adminpb", adminpb.get_admin);

// Master Barang
router.get("/barang/grup", grup.getGrup);
router.get("/barang/kategory", kategory.getKategory);
router.get("/barang/kemasan", kemasan.getKemasan);
router.get("/barang/satuan", satuan.getSatuan);
router.get("/barang/cek-barkode/:barcode", masterbarang.cek_barkode);
router.post("/barang/add", masterbarang.add_barang);
router.post("/barang/update/:kode_barang", masterbarang.update_barang);

// Invoice
router.get("/invoice", invoice.cekInvoice);

// Workplan
router.post("/workplan", workplan.create_workplan);
router.get("/workplan", workplan.get_workplan);
router.post("/workplan/update/:id", workplan.update_workplan);
//router.post("/workplan/after/:id", workplan.update_attachment_after);
router.post("/workplan/status/:id", workplan.update_status);

// Workplan Progress
router.post("/workplan/progress", workplanprogress.create_wp_progress);
router.get("/workplan/progress/:wp_id", workplanprogress.get_wp_progress);
router.delete("/workplan/progress/:id", workplanprogress.delete_wp_progress);

// Workplan Comment
router.post("/workplan/comment/:id", workplancomment.create_comment);
router.get("/workplan/comment/:id", workplancomment.get_workplan_comment);

module.exports = { router };
