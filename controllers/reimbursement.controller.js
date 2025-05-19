const { Op, Sequelize, literal } = require("sequelize");
const db_user = require("../db/user.db");
const { decodeToken, getToken } = require("../utils/jwt");
const { Responder } = require("../utils/responder");
const {
  generateRandomNumber,
  getFormattedDate,
  ubahDataById,
  getDateValidFormat,
  addAdminApprovalDate,
} = require("../utils/utils");
const moment = require("moment");
require("moment/locale/id");
moment.locale("id");
const {
  sendSingleMessage,
  sendMulticastMessage,
} = require("../utils/firebase");
const { uploadImagesCloudinary } = require("../utils/cloudinary");
const { uploadToDrive } = require("../utils/uploadToDrive");
const { uploadToCPanel } = require("../utils/uploadToCPanel");

const M_Cabang = db_user.cabang;
const Reimbursement = db_user.reimbursement;
const User = db_user.ruser;
const Admin = db_user.superuser;
const INVOICE = db_user.invoice;
const Suplier = db_user.suplier;

// Get all cabang list
exports.cabang = async (req, res) => {
  try {
    const cabang = await M_Cabang.findAll({
      attributes: ["kd_induk", "nm_induk"],
    });

    Responder(res, "OK", null, cabang, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

// Request reimbursement
exports.reimbursement = async (req, res) => {
  const { authorization } = req.headers;
  const {
    type,
    date,
    cabang,
    description,
    attachment,
    bank_detail,
    nominal,
    name,
    item,
    coa,
    file,
    approved_by,
    parentId,
    payment_type,
    tipePembayaran,
    uploadedFile,
    kdsp,
    need_bukti,
    bukti_attachment,
    bukti_file_info,
  } = req.body;
  try {
    if (
      !type ||
      !date ||
      !cabang ||
      !description ||
      !bank_detail ||
      !nominal ||
      !item ||
      !coa ||
      !approved_by ||
      !payment_type
    ) {
      console.log("TIDAK LENGKAP");
      return Responder(res, "ERROR", "Data tidak lengkap!", null, 400);
    }

    const userData = decodeToken(getToken(authorization));

    let no_dok = "";

    do {
      // Generate nomor dokumen baru
      const doc_no_gen = `RR-${getFormattedDate()}-${generateRandomNumber(
        1000000,
        9999999
      )}`;

      // Cek apakah nomor dokumen sudah ada di database
      const checkDoc = await Reimbursement.findOne({
        where: {
          no_doc: doc_no_gen,
        },
      });

      // Jika tidak ditemukan, gunakan nomor dokumen ini
      if (!checkDoc) {
        no_dok = doc_no_gen;
      }
    } while (!no_dok);

    const getUser = await User.findOne({ where: { iduser: userData.iduser } });
    const userDetail = await getUser["dataValues"];

    delete userDetail.userToken;

    // get cabang
    const getCabang = await M_Cabang.findOne({ where: { kd_induk: cabang } });
    const cabangData = getCabang["dataValues"];

    const getType = () => {
      switch (type) {
        case "PR":
          return "Payment Request";
          break;
        case "RR":
          return "Reimbursement";
          break;
        case "CA":
          return "Cash Advance";
          break;
        case "CAR":
          return "Cash Advance Report";
          break;
        case "PCR":
          return "Petty Cash Request";
          break;
        case "PC":
          return "Petty Cash Report";
          break;
        default:
          return "-";
          break;
      }
    };

    // =================== INVOICE CHECKING
    const isInvoiceUsed = await Promise.all(
      item.map(async (item) => {
        const getInv = await INVOICE.findOne({
          where: {
            invoice: item.invoice,
          },
        });

        return !!getInv;
      })
    );

    if (isInvoiceUsed.includes(true)) {
      Responder(res, "ERROR", "No. Invoice telah digunakan.", null, 400);
      return;
    }

    // =================== Cash Advance Section

    // Report Parent Doc
    let parentDoc;
    let parentNominal;
    let parentPaymentType;

    // === Handle report cash advance
    if (parentId) {
      const getParent = await Reimbursement.findOne({
        where: {
          id: parentId,
        },
      });

      const parentData = await getParent["dataValues"];

      parentDoc = parentData.no_doc;
      parentNominal = parentData?.nominal;
      parentPaymentType = parentData?.payment_type;
    }

    // =============== ADMIN SECTION

    // Get Approval Admin List
    const getApprovalAdmin = await Admin.findOne({
      where: { iduser: approved_by },
    });

    // Get Admin fcm list
    const getAdminFcmData = await User.findOne({
      where: { iduser: approved_by },
    });

    const admin = await getApprovalAdmin["dataValues"];

    let adminFCM = "";

    if (getAdminFcmData) {
      const adminSession = await getAdminFcmData["dataValues"];
      adminFCM = adminSession.fcmToken;
    }

    const adminData = {
      iduser: admin.iduser,
      nm_user: admin.nm_user,
      status: "WAITING",
    };

    // ============ POST DATA Section

    // Upload Attchment
    let uploadAttachment;

    console.log("FILE", file);

    if (!uploadedFile) {
      if (file.type !== "application/pdf") {
        console.log("IMAGE FILE");
        const upload = await uploadImagesCloudinary(attachment);
        uploadAttachment = upload.secure_url;
      } else {
        console.log("PDF File");
        //const upload = await uploadToDrive(attachment, file.name);
        const upload = await uploadToCPanel(attachment, file.name);
        uploadAttachment = upload;
      }
    } else {
      // use existing file
      uploadAttachment = uploadedFile;
    }

    let uploadedBuktiAttachment;

    if (need_bukti) {
      if (bukti_file_info.type !== "application/pdf") {
        console.log("IMAGE FILE");
        const upload = await uploadImagesCloudinary(bukti_attachment);
        uploadedBuktiAttachment = upload.secure_url;
      } else {
        console.log("PDF File");
        //const upload = await uploadToDrive(bukti_attachment, file.name);
        const upload = await uploadToCPanel(bukti_attachment, file.name);
        uploadedBuktiAttachment = upload;
      }
    }

    await Reimbursement.create({
      no_doc: no_dok,
      jenis_reimbursement: getType() || "-",
      tanggal_reimbursement: date || "-",
      kode_cabang: `${cabangData["kd_induk"]} - ${cabangData["nm_induk"]}`,
      requester_id: userDetail.iduser || "-",
      requester_name: userDetail.nm_user || "-",
      requester: userDetail || "-",
      description: description || "-",
      status: "WAITING",
      attachment: uploadAttachment || "",
      bank_detail: bank_detail || "-",
      note: null,
      finance_note: null,
      accepted_date: null,
      accepted_by: [adminData],
      nominal: nominal || "-",
      name: name || "-",
      item: item || "-",
      coa: coa,
      file_info: file,
      status_finance: "IDLE",
      status_finance_child: "IDLE",
      finance_by: "",
      realisasi: "",
      pengajuan_ca: parentNominal || "",
      childId: "",
      parentId: parentId,
      parentDoc: parentDoc,
      childDoc: "",
      payment_type: payment_type,
      tipePembayaran: tipePembayaran,
      reviewStatus: "IDLE",
      review_note: "",
      makerStatus: "IDLE",
      maker_note: "",
      needExtraAcceptance: false,
      extraAcceptance: {},
      extraAcceptanceStatus: "IDLE",
      kdsp: kdsp ?? null,
      bukti_attachment: uploadedBuktiAttachment || "",
      bukti_file_info: bukti_file_info,
      remarked: false,
    })
      .then(async (data) => {
        // Handle Invoice
        item.map((item) => {
          INVOICE.create({ ...item, nama: item.name, rop_id: data.id });
        });

        // Parent ID
        if (parentId) {
          await Reimbursement.update(
            { childId: data?.id, childDoc: data?.no_doc },
            { where: { id: parentId } }
          );
          Responder(res, "OK", null, data, 200);
          return;
        }
        Responder(res, "OK", null, data, 200);
        return;
      })
      .catch((err) => {
        console.log(err);
        Responder(res, "ERROR", null, null, 400);
        return;
      });

    if (adminFCM) {
      console.log("ADMIN HAS FCM");
      sendSingleMessage(adminFCM, {
        title: "Ada pengajuan request of payment baru!",
        body: `${userDetail?.nm_user} telah mengajukan permintaan request of payment!`,
      });
      // sendMulticastMessage(reviewerTokens, {
      //   title: "Ada pengajuan request of payment baru!",
      //   body: `${userDetail?.nm_user} telah mengajukan request of payment dan perlu direview!`,
      // });
    }
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.get_reimbursement = async (req, res) => {
  const { authorization } = req.headers;
  const {
    page = 1,
    limit = 10,
    monthyear,
    status,
    cari,
    type,
    statusCA,
    statusROP,
    periodeStart,
    periodeEnd,
    cabang,
  } = req.query;

  try {
    const userData = decodeToken(getToken(authorization));

    const whereClause = { requester_id: userData?.iduser };

    if (monthyear) {
      const my = monthyear.split("-");
      const month = my[0];
      const year = my[1];

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (periodeStart && periodeEnd) {
      whereClause.createdAt = {
        [Op.between]: [periodeStart, periodeEnd],
      };
    }

    // status CA
    if (statusCA) {
      if (statusCA == "DONE") {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: "DONE" },
        ];
      } else {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: { [Op.ne]: "DONE" } },
        ];
      }
    }

    // status rop
    if (statusROP) {
      if (statusROP == "WAITING") {
        whereClause[Op.and] = [
          { status: "WAITING" },
          { status_finance: { [Op.notIn]: ["DONE", "REJECTED"] } },
        ];
      } else if (statusROP == "APPROVED") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { status_finance: { [Op.notIn]: ["DONE", "REJECTED"] } },
        ];
      } else if (statusROP == "REJECTED") {
        whereClause.status = "REJECTED";
      } else if (statusROP == "DONE") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { status_finance: "DONE" },
        ];
      }
    }

    // Cabang
    if (cabang) {
      const cabangValues = cabang.split(",");

      whereClause.kode_cabang = {
        [Op.or]: cabangValues.map((value) => ({
          [Op.like]: `${value} -%`,
        })),
      };
    }

    // Tipe Pembayaran
    if (type) {
      if (type == "CASH") {
        whereClause.payment_type = "CASH";
      } else if (type == "TRANSFER") {
        whereClause.payment_type = "TRANSFER";
      }
    }

    // Menambahkan filter berdasarkan status jika diberikan
    if (status === "01") {
      // whereClause.status = { [Op.ne]: "WAITING" }; // Memilih status selain 'APPROVED'
      whereClause[Op.or] = [
        {
          status: "APPROVED",
          status_finance: "DONE",
          status_finance_child: "DONE",
          extraAcceptanceStatus: "APPROVED",
        },
        {
          status: "REJECTED",
        },
      ];
    } else if (status === "00") {
      whereClause[Op.or] = [
        { status: "WAITING" },
        { status_finance: "WAITING", extraAcceptanceStatus: "WAITING" },
        {
          status: "APPROVED",
          status_finance: { [Op.ne]: "DONE" },
        },
        {
          status: "APPROVED",
          status_finance: "DONE",
          jenis_reimbursement: "Cash Advance",
          status_finance_child: "IDLE",
        },
      ];
    }

    if (cari && cari.length > 0) {
      const searchSplit = cari.split(" ");
      const searchConditions = searchSplit.map((item) => ({
        [Op.or]: [
          Sequelize.fn(
            "JSON_CONTAINS",
            Sequelize.col("item"),
            `[{"invoice": "${item}"}]`
          ),
          {
            jenis_reimbursement: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            kode_cabang: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            coa: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            requester_name: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            tipePembayaran: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            no_doc: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            name: {
              [Op.like]: `%${item}%`,
            },
          },
        ],
      }));

      whereClause[Op.and] = searchConditions;
    }

    // Menambahkan pengurutan berdasarkan tipePembayaran
    const orderClause = [
      ["tipePembayaran", "DESC"], // Mengurutkan dari Urgent ke Regular
      ["createdAt", "DESC"], // Mengurutkan berdasarkan createdAt secara descending
    ];

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: orderClause,
      include: [
        {
          model: Suplier,
          as: "suplierDetail",
          required: false, // left join
        },
      ],
    });

    // result count
    const resultCount = requested?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    if (requested?.rows.length) {
      Responder(
        res,
        "OK",
        null,
        {
          rows: requested.rows,
          pageInfo: {
            pageNumber: parseInt(page),
            pageLimit: parseInt(limit),
            pageCount: totalPageFormatted,
            pageSize: resultCount,
          },
        },
        200
      );
      return;
    } else {
      Responder(res, "OK", null, [], 200);
      return;
    }
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.acceptance = async (req, res) => {
  const { id } = req.params;
  const { fowarder_id, status, nominal, note, coa, cabang } = req.body;
  const { authorization } = req.headers;

  try {
    const datas = await Reimbursement.findOne({
      where: {
        id: id,
      },
    });

    const userData = decodeToken(getToken(authorization));
    const userId = userData.iduser;

    // reimbursement data
    const r_datas = await datas["dataValues"];
    const user_fcm = r_datas["requester"]["fcmToken"];
    const acceptance_by = r_datas["accepted_by"];
    const parentId = r_datas["parentId"];
    const childId = r_datas["childId"];
    const extNote = r_datas.note;
    const items = r_datas.item;

    // Update cabang if cabang updated
    if (cabang && status == "APPROVED") {
      // get cabang
      const getCabang = await M_Cabang.findOne({ where: { kd_induk: cabang } });
      const cabangData = getCabang["dataValues"];

      await Reimbursement.update(
        {
          kode_cabang: `${cabangData["kd_induk"]} - ${cabangData["nm_induk"]}`,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }

    const currentDate = moment().format("DD-MM-YYYY");

    addAdminApprovalDate(acceptance_by, userId, currentDate);

    if (status == "FOWARDED") {
      ubahDataById(acceptance_by, userId, "iduser", "status", "APPROVED");

      const getApprovalAdmin = await Admin.findOne({
        where: { iduser: fowarder_id },
      });

      const admin = await getApprovalAdmin["dataValues"];

      const adminData = {
        iduser: admin.iduser,
        nm_user: admin.nm_user,
        status: "WAITING",
      };

      acceptance_by.push(adminData);

      // ===  SEND NOTIF TO NEXT ADMIN

      let fowarderToken = "";

      const getAdminSession = await User.findOne({
        where: { iduser: fowarder_id },
      });

      if (getAdminSession) {
        const adminSession = await getAdminSession["dataValues"];
        fowarderToken = adminSession.fcmToken;
      }

      if (fowarderToken) {
        sendSingleMessage(fowarderToken, {
          title: "Ada pengajuan request of payment baru!",
          body: `Ada pengajuan request of payment yang diteruskan dan menunggu persetujuan anda.`,
        });
      }
    }

    if (status == "APPROVED") {
      ubahDataById(acceptance_by, userId, "iduser", "status", "APPROVED");

      let reviewerTokens = [];

      const reviewer = await User.findAll({
        where: {
          type: "REVIEWER",
        },
        attributes: ["fcmToken"],
      });

      reviewer.every((res) => reviewerTokens.push(res.fcmToken));

      if (user_fcm) {
        sendSingleMessage(user_fcm, {
          title: "Pengajuan anda telah setujui!",
          body: `Pengajuan request of payment anda telah disetujui oleh ${
            userData?.nm_user || "penyetuju"
          } dan menunggu diproses.`,
        });
      }

      // === Handle notif to reviewer
      if (reviewerTokens.length > 0) {
        sendMulticastMessage(reviewerTokens, {
          title: "Ada pengajuan request of payment baru!",
          body: `Ada pengajuan request of payment baru yang perlu direview!`,
        });
      }
    }

    if (status == "REJECTED") {
      ubahDataById(acceptance_by, userId, "iduser", "status", "REJECTED");

      if (user_fcm) {
        sendSingleMessage(user_fcm, {
          title: "Pengajuan anda telah tolak!",
          body: `Pengajuan request of payment anda telah ditolak oleh ${
            userData?.nm_user || "penyetuju"
          }.`,
        });
      }

      // Remove used invoice on rejected
      items.map(async (item) => {
        await INVOICE.destroy({
          where: {
            invoice: item.invoice,
          },
        });
      });

      // Remove from parent if rejected
      if (parentId) {
        await Reimbursement.update(
          {
            childId: "",
            childDoc: "",
            realisasi: "",
          },
          {
            where: {
              id: parentId,
            },
          }
        );
      }
    }

    const current_date =
      status == "APPROVED"
        ? moment().format("YYYY-MM-DD HH:mm:ss").toString()
        : "";

    const status_change = status == "FOWARDED" ? "WAITING" : status;

    const status_finance = status == "APPROVED" ? "WAITING" : "IDLE";

    const formNote = `${extNote && extNote.length > 0 ? extNote + "||" : ""}${
      userData.nm_user
    }:${note}`;

    return await Reimbursement.update(
      {
        accepted_date: current_date,
        accepted_by: acceptance_by,
        status: status_change,
        nominal: "Rp. " + nominal,
        note: formNote,
        status_finance: status_finance,
        coa: coa,
      },
      {
        where: {
          id: id,
        },
      }
    )
      .then(async () => {
        // Update if has parent ID ( Cash Advance Report )
        if (parentId && status !== "REJECTED") {
          await Reimbursement.update(
            {
              realisasi: "Rp. " + nominal,
              coa: coa,
            },
            {
              where: {
                id: parentId,
              },
            }
          );
        }
        Responder(
          res,
          "OK",
          null,
          { updated: true, message: "Pengajuan berhasil di update!" },
          200
        );
        return;
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.get_status = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Reimbursement.findOne({
      where: {
        id: id,
      },
      attributes: [
        "status",
        "accepted_by",
        "status_finance",
        "finance_by",
        "realisasi",
        "coa",
        "reviewStatus",
        "makerStatus",
        "review_note",
        "finance_note",
        "finance_bank",
        "maker_note",
        "note",
        "needExtraAcceptance",
        "extraAcceptance",
        "extraAcceptanceStatus",
        "reviewer_approve",
        "maker_approve",
        "extra_admin_approve",
        "attachment",
        "file_info",
        "nm_reviewer_approve",
        "nm_maker_approve",
        "kode_cabang",
        "bukti_attachment",
        "bukti_file_info",
      ],
    });

    // handle note
    let adminNote = [];

    const note = data?.note ?? "";

    if (note && note.length > 0) {
      const split = note.split("||");
      for (let i = 0; i < split.length; i++) {
        const spl = split[i].split(":");
        const base = {
          title: `Catatan ${spl[0]}`,
          msg: spl[1] || "-",
        };
        adminNote.push(base);
      }
    }

    const reviewerNote = data.review_note
      ? [
          {
            title: "Reviewer Note",
            msg: data.review_note,
          },
        ]
      : [];

    const makerNote = data.maker_note
      ? [
          {
            title: "Maker Note",
            msg: data.maker_note,
          },
        ]
      : [];

    const financeNote = data.finance_note
      ? [
          {
            title: "Finance Note",
            msg: data.finance_note,
          },
        ]
      : [];

    const extraNote = data.extraAcceptance.note
      ? [
          {
            title: `${data.extraAcceptance.nm_user} Note`,
            msg: data.extraAcceptance.note,
          },
        ]
      : [];

    const allNote = [
      ...adminNote,
      ...reviewerNote,
      ...makerNote,
      ...financeNote,
      ...extraNote,
    ];

    let adminPath = data.accepted_by;
    const adminDONE = adminPath.every((item) => item.status == "APPROVED");

    if (adminDONE) {
      adminPath.push({
        nm_user: "Reviewer",
        status: data.reviewStatus,
        tgl_approve: data.reviewer_approve,
      });
    }

    if (data.reviewStatus === "APPROVED") {
      adminPath.push({
        nm_user: "Maker",
        status: data.makerStatus,
        tgl_approve: data.maker_approve,
      });

      if (data.makerStatus === "APPROVED") {
        adminPath.push({
          nm_user: data.finance_by?.nm_user
            ? `${data.finance_by?.nm_user} (Finance)`
            : "Finance",
          status: data.status_finance,
          tgl_approve: data.finance_by.acceptDate,
        });
      }
    }

    if (data.reviewStatus !== "APPROVED") {
      adminPath = adminPath.filter(
        (item) => item.nm_user !== "Maker" || item.nm_user !== "Finance"
      );
    }

    if (data.makerStatus !== "APPROVED") {
      adminPath = adminPath.filter((item) => item.nm_user !== "Finance");
    }

    if (data.needExtraAcceptance && data.extraAcceptance?.iduser) {
      adminPath.push({
        nm_user: data.extraAcceptance.nm_user,
        status: data.extraAcceptance.status,
        tgl_approve: data.extra_admin_approve,
      });
    }

    // Update rev name
    const findRevIndex = adminPath.findIndex(
      (item) => item.nm_user == "Reviewer"
    );

    if (findRevIndex && data.nm_reviewer_approve) {
      adminPath[
        findRevIndex
      ].nm_user = `${data.nm_reviewer_approve} (Reviewer)`;
    }

    // Update rev name
    const findMakerIndex = adminPath.findIndex(
      (item) => item.nm_user == "Maker"
    );

    if (findMakerIndex && data.nm_maker_approve) {
      adminPath[findMakerIndex].nm_user = `${data.nm_maker_approve} (Maker)`;
    }

    const dataStatus = await data["dataValues"];

    const response = {
      ...dataStatus,
      notes: allNote,
      acceptance: adminPath,
    };

    Responder(res, "OK", null, response, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.finance_acceptance = async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;
  const { authorization } = req.headers;
  const { nominal, note, coa, bank, extra, cabang } = req.body;
  try {
    const userData = decodeToken(getToken(authorization));

    const financeData = {
      nm_user: userData.nm_user,
      iduser: userData?.iduser,
      acceptDate: moment().format("YYYY-MM-DD"),
    };

    const getReimburse = await Reimbursement.findOne({
      where: {
        id: id,
      },
    });

    const reimbursementData = await getReimburse["dataValues"];
    const userRequested = reimbursementData.requester;
    const parentId = reimbursementData.parentId;
    const jenis = reimbursementData?.jenis_reimbursement;
    const bankDetail = reimbursementData?.bankDetail;
    const items = reimbursementData.item;

    const IS_CONFIRM_ONLY = !bankDetail?.accountname?.length;

    const userFcm = userRequested.fcmToken;

    if (status == "REJECTED") {
      // Remove used invoice on rejected
      items.map(async (item) => {
        await INVOICE.destroy({
          where: {
            invoice: item.invoice,
          },
        });
      });

      if (parentId) {
        await Reimbursement.update(
          {
            childId: "",
            childDoc: "",
            realisasi: "",
          },
          {
            where: {
              id: parentId,
            },
          }
        );
      }

      return await Reimbursement.update(
        {
          status_finance: status,
          finance_by: financeData,
          finance_note: note || "-",
          status: "REJECTED",
        },
        {
          where: {
            id: id,
          },
        }
      )
        .then(async () => {
          if (userFcm) {
            sendSingleMessage(userFcm, {
              title: "Pengajuan request of payment anda ditolak finance!",
              body: IS_CONFIRM_ONLY
                ? `Laporan anda telah ditolak oleh ${financeData.nm_user} - tim finance`
                : `Pengajuan request of payment anda telah ditolak oleh ${financeData?.nm_user}`,
            });
          }
          return Responder(res, "OK", null, { updated: true }, 200);
        })
        .catch((err) => {
          return Responder(res, "ERROR", null, { updated: true }, 400);
        });
    }

    // Handle if has parent id ( Cash Advance Report )
    if (parentId) {
      await Reimbursement.update(
        {
          realisasi: nominal,
          coa: coa,
          status_finance_child: "DONE",
        },
        {
          where: {
            id: parentId,
          },
        }
      );
    }

    // IF NEED EXTRA APPROVAL
    if (extra) {
      const getApprovalAdmin = await Admin.findOne({
        where: { iduser: extra },
      });

      const admin = await getApprovalAdmin["dataValues"];
      const adminFCM = admin["fcmToken"];

      if (adminFCM) {
        sendSingleMessage(adminFCM, {
          title: "Ada pengajuan request of payment baru.",
          body: "Ada pengajuan request of payment baru yang diteruskan oleh finance dan menunggu persetujuan.",
        });
      }

      const adminData = {
        iduser: admin.iduser,
        nm_user: admin.nm_user,
        status: "WAITING",
      };

      extraData = adminData;

      await Reimbursement.update(
        {
          finance_note: note || "-",
          coa: coa,
          finance_bank: bank || "-",
          needExtraAcceptance: true,
          extraAcceptance: adminData,
          extraAcceptanceStatus: "WAITING",
        },
        {
          where: {
            id: id,
          },
        }
      );

      // Update cabang if cabang updated
      if (cabang && status == "DONE") {
        // get cabang
        const getCabang = await M_Cabang.findOne({
          where: { kd_induk: cabang },
        });
        const cabangData = getCabang["dataValues"];

        await Reimbursement.update(
          {
            kode_cabang: `${cabangData["kd_induk"]} - ${cabangData["nm_induk"]}`,
          },
          {
            where: {
              id: id,
            },
          }
        );
      }

      return Responder(
        res,
        "OK",
        null,
        {
          updated: true,
          message: "Pengajuan telah diteruskan untuk disetujui lebih lanjut!",
        },
        200
      );
    }

    // Update cabang if cabang updated
    if (cabang && status == "DONE") {
      // get cabang
      const getCabang = await M_Cabang.findOne({ where: { kd_induk: cabang } });
      const cabangData = getCabang["dataValues"];

      await Reimbursement.update(
        {
          kode_cabang: `${cabangData["kd_induk"]} - ${cabangData["nm_induk"]}`,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }

    return await Reimbursement.update(
      {
        status_finance: status,
        status_finance_child: jenis == "Cash Advance" ? "IDLE" : status,
        finance_by: financeData,
        finance_note: note || "-",
        coa: coa,
        finance_bank: bank || "-",
        extraAcceptanceStatus: status == "REJECTED" ? "REJECTED" : "APPROVED",
      },
      {
        where: {
          id: id,
        },
      }
    )
      .then(async () => {
        if (userFcm) {
          sendSingleMessage(userFcm, {
            title: "Pengajuan request of payment anda telah di proses finance!",
            body: IS_CONFIRM_ONLY
              ? `Laporan anda telah diterima oleh ${financeData.nm_user} - tim finance`
              : `Pengajuan request of payment anda telah diproses oleh ${financeData?.nm_user} sebesar ${nominal}`,
          });
        }
        return Responder(res, "OK", null, { updated: true }, 200);
      })
      .catch((err) => {
        return Responder(res, "ERROR", null, { updated: true }, 400);
      });
  } catch (error) {
    console.log("ERR", error);
    return Responder(res, "ERROR", null, null, 400);
  }
};

exports.finance_acceptance_multi = async (req, res) => {
  const { ids } = req.body;
  const { authorization } = req.headers;
  try {
    const userData = decodeToken(getToken(authorization));

    const financeData = {
      nm_user: userData.nm_user,
      iduser: userData?.iduser,
      acceptDate: moment().format("YYYY-MM-DD"),
    };

    ids.map(async (itemId) => {
      const getReimburse = await Reimbursement.findOne({
        where: {
          id: itemId,
        },
      });

      const reimbursementData = await getReimburse["dataValues"];
      const userRequested = reimbursementData.requester;
      const parentId = reimbursementData.parentId;
      const jenis = reimbursementData?.jenis_reimbursement;
      const bankDetail = reimbursementData?.bankDetail;
      const nominal = reimbursementData?.nominal;

      const IS_CONFIRM_ONLY = !bankDetail?.accountname?.length;

      const userFcm = userRequested.fcmToken;

      // Handle if has parent id ( Cash Advance Report )
      if (parentId) {
        await Reimbursement.update(
          {
            realisasi: nominal,
            status_finance_child: "DONE",
          },
          {
            where: {
              id: parentId,
            },
          }
        );
      }

      return await Reimbursement.update(
        {
          status_finance: "DONE",
          status_finance_child: jenis == "Cash Advance" ? "IDLE" : "DONE",
          finance_by: financeData,
          finance_note: "",
          extraAcceptanceStatus: "APPROVED",
        },
        {
          where: {
            id: itemId,
          },
        }
      )
        .then(async () => {
          if (userFcm) {
            sendSingleMessage(userFcm, {
              title:
                "Pengajuan request of payment anda telah di proses finance!",
              body: IS_CONFIRM_ONLY
                ? `Laporan anda telah diterima oleh ${financeData.nm_user} - tim finance`
                : `Pengajuan request of payment anda telah diproses oleh ${financeData?.nm_user} sebesar ${nominal}`,
            });
          }
          return Responder(res, "OK", null, { updated: true }, 200);
        })
        .catch((err) => {
          return Responder(res, "ERROR", null, { updated: true }, 400);
        });
    });
  } catch (error) {
    console.log("ERR", error);
    return Responder(res, "ERROR", null, null, 400);
  }
};

exports.get_detail = async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;
  try {
    const condition = {
      where: {
        id: id,
      },
      include: [
        {
          model: Suplier,
          as: "suplierDetail",
          required: false, // left join
        },
      ],
    };

    if (type && type == "VALUE") {
      condition.attributes = ["nominal", "realisasi"];
    }

    const data = await Reimbursement.findOne(condition);

    // handle note
    let adminNote = [];

    if (data.note && data.note.length > 0) {
      const split = data.note.split("||");
      for (let i = 0; i < split.length; i++) {
        const spl = split[i].split(":");
        const base = {
          title: `Catatan ${spl[0]}`,
          msg: spl[1] || "-",
        };
        adminNote.push(base);
      }
    }

    const reviewerNote = data.review_note
      ? [
          {
            title: "Reviewer Note",
            msg: data.review_note,
          },
        ]
      : [];

    const financeNote = data.finance_note
      ? [
          {
            title: "Finance Note",
            msg: data.finance_note,
          },
        ]
      : [];

    const allNote = [...adminNote, ...reviewerNote, ...financeNote];

    const reimData = await data["dataValues"];

    const response = {
      ...reimData,
      notes: allNote,
    };

    Responder(res, "OK", null, response, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.finance_update_coa = async (req, res) => {
  const { id } = req.params;
  const { coa } = req.body;
  try {
    const R_DATA = await Reimbursement.findOne({
      where: {
        id: id,
      },
    });

    const r_datas = await R_DATA["dataValues"];
    const parentId = r_datas["parentId"];
    const childId = r_datas["childId"];

    // Main function
    await Reimbursement.update(
      { coa: coa },
      {
        where: {
          id: id,
        },
      }
    );

    // Handle if has parent id ( Cash Advance Report )
    if (parentId) {
      await Reimbursement.update(
        { coa: coa },
        {
          where: {
            id: parentId,
          },
        }
      );
    }

    // Handle if has child id ( Cash Advance )
    if (childId) {
      await Reimbursement.update(
        {
          coa: coa,
        },
        {
          where: {
            id: childId,
          },
        }
      );
    }

    Responder(res, "OK", null, { updated: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
  }
};

exports.cancel_upload = async (req, res) => {
  const { id } = req.params;
  try {
    // Get selected reimburse
    const DETAILS = await Reimbursement.findOne({
      where: {
        id: id,
      },
    });

    const DETAILS_DATA = await DETAILS["dataValues"];
    const items = DETAILS_DATA["item"];

    // Remove invoice
    items.map(async (item) => {
      await INVOICE.destroy({
        where: {
          invoice: item.invoice,
        },
      });
    });

    // Get selected parent ID
    if (DETAILS_DATA?.parentId) {
      await Reimbursement.update(
        {
          childId: "",
          childDoc: "",
          realisasi: "",
        },
        {
          where: {
            id: DETAILS_DATA?.parentId,
          },
        }
      );
    }

    // Destroy reimburse
    await Reimbursement.destroy({
      where: {
        id: id,
      },
    });

    Responder(res, "OK", null, { deleted: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.get_super_reimbursement = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    monthyear,
    cari,
    startDate,
    endDate,
    cabang,
    bank,
    coa,
    type,
    finance,
    statusCA,
    statusROP,
  } = req.query;

  try {
    const whereClause = {};

    if (startDate && endDate) {
      const validStartDate = getDateValidFormat(startDate);
      const validEndDate = getDateValidFormat(endDate);

      const startDateObj = moment(validStartDate, "YYYY-MM-DD", true)
        .startOf("day")
        .toDate();
      const endDateObj = moment(validEndDate, "YYYY-MM-DD", true)
        .endOf("day")
        .toDate();

      whereClause.createdAt = {
        [Op.between]: [startDateObj, endDateObj],
      };
    }

    // status CA
    if (statusCA) {
      if (statusCA == "DONE") {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: "DONE" },
        ];
      } else {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: { [Op.ne]: "DONE" } },
        ];
      }
    }

    // status ROP
    if (statusROP) {
      if (statusROP == "WAITING") {
        whereClause[Op.and] = [
          { status: "WAITING" },
          { status_finance: { [Op.notIn]: ["DONE", "REJECTED"] } },
        ];
      } else if (statusROP == "APPROVED") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { status_finance: { [Op.notIn]: ["DONE", "REJECTED"] } },
        ];
      } else if (statusROP == "REJECTED") {
        whereClause[Op.and] = [{ status: "REJECTED" }];
      } else if (statusROP == "DONE") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { status_finance: "DONE" },
        ];
      }
    }

    // Tipe Pembayaran
    if (type) {
      if (type == "CASH") {
        whereClause.payment_type = "CASH";
      } else if (type == "TRANSFER") {
        whereClause.payment_type = "TRANSFER";
      }
    }

    // Finance Status Pembayaran
    if (finance) {
      console.log("HAS FINANCE FILTER", finance);
      if (finance === "DONE") {
        whereClause.status_finance = {
          [Op.in]: ["DONE", "REJECTED"],
        };
      } else if (finance === "WAITING") {
        whereClause.status_finance = {
          [Op.notIn]: ["DONE", "REJECTED"],
        };
      }
    }

    // Cabang
    if (cabang) {
      const cabangValues = cabang.split(",");

      whereClause.kode_cabang = {
        [Op.or]: cabangValues.map((value) => ({
          [Op.like]: `${value} -%`,
        })),
      };
    }

    if (coa) {
      whereClause.coa = {
        [Op.startsWith]: coa,
      };
    }

    if (bank) {
      whereClause.finance_bank = bank;
    }

    if (monthyear) {
      const my = monthyear.split("-");
      const month = my[0];
      const year = my[1];

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (cari && cari.length > 0) {
      const searchSplit = cari.split(" ");
      const searchConditions = searchSplit.map((item) => ({
        [Op.or]: [
          Sequelize.fn(
            "JSON_CONTAINS",
            Sequelize.col("item"),
            `[{"invoice": "${item}"}]`
          ),
          {
            jenis_reimbursement: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            kode_cabang: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            coa: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            requester_name: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            tipePembayaran: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            no_doc: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            name: {
              [Op.like]: `%${item}%`,
            },
          },
        ],
      }));

      whereClause[Op.and] = searchConditions;
    }

    // Menambahkan pengurutan berdasarkan tipePembayaran
    const orderClause = [
      ["tipePembayaran", "DESC"], // Mengurutkan dari Urgent ke Regular
      ["createdAt", "DESC"], // Mengurutkan berdasarkan createdAt secara descending
    ];

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: orderClause,
    });

    // result count
    const resultCount = requested?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    if (requested?.rows.length) {
      Responder(
        res,
        "OK",
        null,
        {
          rows: requested.rows,
          pageInfo: {
            pageNumber: parseInt(page),
            pageLimit: parseInt(limit),
            pageCount: totalPageFormatted,
            pageSize: resultCount,
          },
        },
        200
      );
      return;
    } else {
      Responder(res, "OK", null, [], 200);
      return;
    }
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.get_super_reimbursement_report = async (req, res) => {
  const {
    page = 1,
    limit = 1000,
    startDate,
    endDate,
    cabang,
    bank,
    tipe,
    finance,
    tipePeriode,
    rop,
  } = req.query;

  try {
    const startDateObj = moment(startDate, "YYYY-MM-DD", true)
      .startOf("day")
      .toDate();
    const endDateObj = moment(endDate, "YYYY-MM-DD", true)
      .endOf("day")
      .toDate();

    console.log(endDate, startDate);

    const whereClause = {
      status: {
        [Op.ne]: ["REJECTED"],
      },
    };

    if (tipePeriode) {
      if (tipePeriode == "USER") {
        whereClause.createdAt = {
          [Op.between]: [startDateObj, endDateObj],
        };
      } else {
        // Konversi startDate dan endDate menjadi string dalam format "DD-MM-YYYY"
        const startDateStr = moment(startDate).format("DD-MM-YYYY");
        const endDateStr = moment(endDate).format("DD-MM-YYYY");
        // whereClause.maker_approve = {
        //   [Op.and]: [
        //     literal(
        //       `STR_TO_DATE(maker_approve, '%d-%m-%Y') >= STR_TO_DATE('${startDateStr}', '%d-%m-%Y')`
        //     ),
        //     literal(
        //       `STR_TO_DATE(maker_approve, '%d-%m-%Y') <= STR_TO_DATE('${endDateStr}', '%d-%m-%Y')`
        //     ),
        //     { makerStatus: "APPROVED" },
        //   ],
        // };
        whereClause[Op.and] = [
          {
            maker_approve: {
              [Op.and]: [
                literal(
                  `STR_TO_DATE(maker_approve, '%d-%m-%Y') >= STR_TO_DATE('${startDateStr}', '%d-%m-%Y')`
                ),
                literal(
                  `STR_TO_DATE(maker_approve, '%d-%m-%Y') <= STR_TO_DATE('${endDateStr}', '%d-%m-%Y')`
                ),
              ],
            },
          },
          { makerStatus: "APPROVED" }, // Tambahkan kondisi makerStatus di level Op.and utama
        ];
      }
    } else {
      whereClause.createdAt = {
        [Op.between]: [startDateObj, endDateObj],
      };
    }

    if (cabang) {
      const cabangValues = cabang.split(",");

      whereClause.kode_cabang = {
        [Op.or]: cabangValues.map((value) => ({
          [Op.like]: `${value} -%`,
        })),
      };
    }

    if (rop) {
      whereClause.jenis_reimbursement = rop;
    }

    if (bank) {
      whereClause.finance_bank = bank;
    }

    if (tipe) {
      whereClause.payment_type = tipe.toUpperCase();
    }

    // Finance Status Pembayaran
    if (finance) {
      console.log("HAS FINANCE FILTER", finance);
      if (finance === "DONE") {
        whereClause.status_finance = {
          [Op.in]: ["DONE", "REJECTED"],
        };
      } else if (finance === "WAITING") {
        whereClause.status_finance = {
          [Op.notIn]: ["DONE", "REJECTED"],
        };
      }
    }

    // Menambahkan pengurutan berdasarkan tipePembayaran
    const orderClause = [
      ["tipePembayaran", "DESC"], // Mengurutkan dari Urgent ke Regular
      ["createdAt", "DESC"], // Mengurutkan berdasarkan createdAt secara descending
    ];

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: orderClause,
      attributes: [
        "id",
        "no_doc",
        "jenis_reimbursement",
        "tanggal_reimbursement",
        "kode_cabang",
        "requester_id",
        "requester_name",
        "name",
        "coa",
        "item",
        "description",
        "nominal",
        "status",
        "status_finance",
        "finance_by",
        "bank_detail",
        "payment_type",
        "accepted_date",
        "accepted_by",
        "realisasi",
        "tipePembayaran",
        "finance_bank",
        "createdAt",
        "attachment",
        "maker_approve",
        "reviewer_approve",
        "pengajuan_ca",
        "parentDoc",
        "childDoc",
        "finance_note",
        "maker_note",
        "bukti_attachment",
        "remarked",
      ],
    });

    // result count
    const resultCount = requested?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    if (requested?.rows.length) {
      Responder(
        res,
        "OK",
        null,
        {
          rows: requested.rows,
          pageInfo: {
            pageNumber: parseInt(page),
            pageLimit: parseInt(limit),
            pageCount: totalPageFormatted,
            pageSize: resultCount,
          },
        },
        200
      );
      return;
    } else {
      Responder(res, "OK", null, [], 200);
      return;
    }
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.get_review_reimbursement = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    monthyear,
    cari,
    type,
    typePembayaran,
    sort,
    statusCA,
    statusROP,
    periodeStart,
    periodeEnd,
    statusType,
    kategori,
    cabang,
  } = req.query;

  try {
    const whereClause = {};
    let order;

    // Menambahkan pengurutan berdasarkan tipePembayaran
    const orderClause = [
      ["tipePembayaran", "DESC"], // Mengurutkan dari Urgent ke Regular
      ["accepted_date", "DESC"], // Finally, sort by createdAt
      ["createdAt", "DESC"], // Mengurutkan berdasarkan createdAt secara descending
    ];

    const sortClause = Sequelize.literal(`CASE
      WHEN reviewStatus = 'WAITING' THEN 1
      WHEN reviewStatus = 'IDLE' THEN 1
      ELSE 2
    END`);

    // Tipe Pembayaran
    if (typePembayaran) {
      if (typePembayaran == "CASH") {
        whereClause.payment_type = "CASH";
      } else if (typePembayaran == "TRANSFER") {
        whereClause.payment_type = "TRANSFER";
      }
    }

    // status CA
    if (statusCA) {
      if (statusCA == "DONE") {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: "DONE" },
        ];
      } else {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: { [Op.ne]: "DONE" } },
        ];
      }
    }

    // status rop
    if (statusROP) {
      console.log("SELECTED STATUS", statusROP);
      if (statusROP == "WAITING") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { reviewStatus: "IDLE" },
          { status_finance: { [Op.notIn]: ["DONE", "REJECTED"] } },
        ];
      } else if (statusROP == "APPROVED") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { status_finance: { [Op.notIn]: ["DONE", "REJECTED"] } },
        ];
      } else if (statusROP == "REJECTED") {
        console.log("EXC REJECTED");
        whereClause.status = "REJECTED";
      } else if (statusROP == "DONE") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { status_finance: "DONE" },
        ];
      }
    }

    if (type) {
      if (type == "WAITING") {
        whereClause[Op.or] = [
          {
            [Op.and]: [
              {
                reviewStatus: "IDLE",
              },
              {
                status: "APPROVED",
              },
            ],
          },
          {
            [Op.and]: [
              { reviewStatus: "APPROVED" },
              { status_finance: "DONE" },
              { jenis_reimbursement: "Cash Advance" },
              { status_finance_child: "IDLE" },
            ],
          },
        ];

        order = [
          sortClause,
          ["tipePembayaran", "DESC"], // Mengurutkan dari Urgent ke Regular
          ["accepted_date", "DESC"], // Finally, sort by createdAt
          ["createdAt", "DESC"], // Mengurutkan berdasarkan createdAt secara descending
        ];
      } else {
        whereClause[Op.or] = [
          {
            [Op.and]: [
              { reviewStatus: { [Op.or]: ["APPROVED", "REJECTED"] } },
              { jenis_reimbursement: { [Op.ne]: "Cash Advance" } },
            ],
          },
          {
            [Op.and]: [
              { reviewStatus: "APPROVED" },
              { status_finance: "DONE" },
              { jenis_reimbursement: "Cash Advance" },
              { status_finance_child: "DONE" },
            ],
          },
        ];

        order = orderClause;
      }
    } else {
      if (statusType == "waiting") {
        console.log("SP WAITING");
        whereClause[Op.and] = [
          {
            status: "APPROVED",
          },
          {
            reviewStatus: "IDLE",
          },
          ...(kategori ? [{ tipePembayaran: kategori }] : []),
        ];
        order = [
          ["tipePembayaran", "DESC"],
          ["createdAt", "ASC"],
        ];
      } else {
        console.log("SP DONE");
        whereClause[Op.or] = [
          {
            status: "APPROVED",
            reviewStatus: {
              [Op.ne]: ["IDLE"],
            },
          },
          {
            status: "REJECTED",
            reviewStatus: "REJECTED",
            makerStatus: "IDLE",
          },
          ...(kategori ? [{ tipePembayaran: kategori }] : []),
        ];

        order = [["createdAt", "DESC"]];
      }
    }

    if (monthyear) {
      const my = monthyear.split("-");
      const month = my[0];
      const year = my[1];

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (periodeStart && periodeEnd) {
      whereClause.accepted_date = {
        [Op.between]: [periodeStart, periodeEnd],
      };
    }

    // if (periodeEnd) {
    //   whereClause.accepted_date = {
    //     [Op.lte]: periodeEnd,
    //   };
    // }

    if (cari && cari.length > 0) {
      const searchSplit = cari.split(" ");
      const searchConditions = searchSplit.map((item) => ({
        [Op.or]: [
          Sequelize.fn(
            "JSON_CONTAINS",
            Sequelize.col("item"),
            `[{"invoice": "${item}"}]`
          ),
          {
            jenis_reimbursement: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            kode_cabang: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            coa: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            nominal: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            no_doc: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            name: {
              [Op.like]: `%${item}%`,
            },
          },
        ],
      }));

      whereClause[Op.and] = searchConditions;
    }

    if (cabang) {
      const cabangValues = cabang.split(",");

      whereClause.kode_cabang = {
        [Op.or]: cabangValues.map((value) => ({
          [Op.like]: `${value} -%`,
        })),
      };
    }

    // Admin already accepted
    //whereClause.status = "APPROVED";

    //     let order;

    //     if (sort) {
    //       order = [
    //         sortClause, // First, sort by status
    //         ["tipePembayaran", "DESC"], // Then sort by tipePembayaran
    //         ["accepted_date", "ASC"], // Finally, sort by createdAt
    //         ["createdAt", "DESC"], // Finally, sort by createdAt
    //       ];
    //     } else {
    //       order = orderClause;
    //     }

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: order,
    });

    // result count
    const resultCount = requested?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    if (requested?.rows.length) {
      Responder(
        res,
        "OK",
        null,
        {
          rows: requested.rows,
          pageInfo: {
            pageNumber: parseInt(page),
            pageLimit: parseInt(limit),
            pageCount: totalPageFormatted,
            pageSize: resultCount,
          },
        },
        200
      );
      return;
    } else {
      Responder(res, "OK", null, [], 200);
      return;
    }
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.acceptReviewReimbursementData = async (req, res) => {
  const { id } = req.params;
  const { coa, note, status, cabang } = req.body;
  const { authorization } = req.headers;

  try {
    const getReimburse = await Reimbursement.findOne({
      where: {
        id: id,
      },
    });

    const userData = decodeToken(getToken(authorization));

    const getReimburseData = await getReimburse["dataValues"];
    const parentId = getReimburseData.parentId;
    const user_fcm = getReimburseData["requester"]["fcmToken"];
    const currentDate = moment().format("DD-MM-YYYY");
    const items = getReimburseData.item;

    if (status == "REJECTED") {
      // Remove used invoice on rejected
      items.map(async (item) => {
        await INVOICE.destroy({
          where: {
            invoice: item.invoice,
          },
        });
      });

      if (parentId) {
        await Reimbursement.update(
          {
            childId: "",
            childDoc: "",
            realisasi: "",
            reviewer_approve: currentDate,
            nm_reviewer_approve: userData.nm_user,
          },
          {
            where: {
              id: parentId,
            },
          }
        );
      }

      await Reimbursement.update(
        {
          reviewStatus: status,
          review_note: note,
          status: "REJECTED",
          reviewer_approve: currentDate,
          nm_reviewer_approve: userData.nm_user,
        },
        {
          where: {
            id: id,
          },
        }
      );

      sendSingleMessage(user_fcm, {
        title: "Pengajuan request of payment anda telah ditolak!",
        body: "Pengajuan request of payment anda telah di tolak oleh reviewer, mohon periksa kembali data anda!",
      });

      Responder(res, "OK", null, { accepted: true }, 200);
      return;
    }
    // =============== ADMIN SECTION

    // === HANDLE NOTIF TO MAKER
    const getMakerSession = await User.findAll({
      where: {
        type: "MAKER",
      },
      attributes: ["fcmToken"],
    });

    if (getMakerSession) {
      let tokens = [];

      for (let i = 0; i < getMakerSession.length; i++) {
        if (getMakerSession[i].fcmToken) {
          tokens.push(getMakerSession[i].fcmToken);
        }
      }

      if (tokens.length) {
        sendMulticastMessage(tokens, {
          title: "Ada pengajuan request of payment baru!",
          body: "Ada pengajuan request of payment yang telah disetujui oleh reviewer dan menunggu untuk diproses!",
        });
      }
    }

    // Update cabang if cabang updated
    if (cabang && status == "APPROVED") {
      // get cabang
      const getCabang = await M_Cabang.findOne({ where: { kd_induk: cabang } });
      const cabangData = getCabang["dataValues"];

      await Reimbursement.update(
        {
          kode_cabang: `${cabangData["kd_induk"]} - ${cabangData["nm_induk"]}`,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }

    await Reimbursement.update(
      {
        coa: coa,
        review_note: note,
        reviewStatus: status,
        reviewer_approve: currentDate,
        nm_reviewer_approve: userData.nm_user,
      },
      {
        where: {
          id: id,
        },
      }
    );

    Responder(res, "OK", null, { accepted: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.acceptReviewReimbursementDataMulti = async (req, res) => {
  const { status, ids } = req.body;
  const { authorization } = req.headers;

  try {
    // === HANDLE NOTIF TO MAKER
    const getMakerSession = await User.findAll({
      where: {
        type: "MAKER",
      },
      attributes: ["fcmToken"],
    });

    const userData = decodeToken(getToken(authorization));
    const currentDate = moment().format("DD-MM-YYYY");

    ids.map(async (itemId) => {
      // const getReimburse = await Reimbursement.findOne({
      //   where: {
      //     id: itemId,
      //   },
      // });

      if (getMakerSession) {
        let tokens = [];

        for (let i = 0; i < getMakerSession.length; i++) {
          if (getMakerSession[i].fcmToken) {
            tokens.push(getMakerSession[i].fcmToken);
          }
        }

        if (tokens.length) {
          sendMulticastMessage(tokens, {
            title: "Ada pengajuan request of payment baru!",
            body: "Ada pengajuan request of payment yang telah disetujui oleh reviewer dan menunggu untuk diproses!",
          });
        }
      }

      await Reimbursement.update(
        {
          reviewStatus: status,
          reviewer_approve: currentDate,
          nm_reviewer_approve: userData.nm_user,
        },
        {
          where: {
            id: itemId,
          },
        }
      );
    });

    Responder(res, "OK", null, { accepted: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.acceptExtraReimbursement = async (req, res) => {
  const { id } = req.params;
  const { note, status, cabang } = req.body;

  try {
    const getReimburse = await Reimbursement.findOne({
      where: {
        id: id,
      },
    });

    const getReimburseData = await getReimburse["dataValues"];
    const parentId = getReimburseData.parentId;
    const user_fcm = getReimburseData["requester"]["fcmToken"];
    const extras = getReimburseData["extraAcceptance"];
    const currentDate = moment().format("DD-MM-YYYY");

    // update extra status
    extras.status = status;
    extras.note = note;

    if (parentId) {
      await Reimbursement.update(
        {
          childId: "",
          childDoc: "",
          realisasi: "",
          extra_admin_approve: currentDate,
        },
        {
          where: {
            id: parentId,
          },
        }
      );
    }

    await Reimbursement.update(
      {
        extraAcceptance: extras,
        extraAcceptanceStatus: status,
        status: status,
        extra_admin_approve: currentDate,
      },
      {
        where: {
          id: id,
        },
      }
    );

    // === HANDLE NOTIF TO FINANCE
    const getFinanceSession = await User.findAll({
      where: {
        type: "FINANCE",
      },
      attributes: ["fcmToken"],
    });

    if (getFinanceSession) {
      let tokens = [];

      for (let i = 0; i < getFinanceSession.length; i++) {
        if (getFinanceSession[i].fcmToken) {
          tokens.push(getFinanceSession[i].fcmToken);
        }
      }

      if (tokens.length) {
        sendMulticastMessage(tokens, {
          title: "Update persetujuan request of payment!",
          body: `Pengajuan request of payment yang diteruskan telah di ${
            status == "REJECTED" ? "diutolak" : "disetujui"
          }, dan menunggu untuk diselesaikan.`,
        });
      }
    }

    // Update cabang if cabang updated
    if (cabang && status == "APPROVED") {
      // get cabang
      const getCabang = await M_Cabang.findOne({ where: { kd_induk: cabang } });
      const cabangData = getCabang["dataValues"];

      await Reimbursement.update(
        {
          kode_cabang: `${cabangData["kd_induk"]} - ${cabangData["nm_induk"]}`,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }

    Responder(
      res,
      "OK",
      null,
      {
        accepted: true,
        message: `Pengajuan telah ${
          status == "REJECTED" ? "ditolak." : "disetujui."
        }`,
      },
      200
    );
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.change_admin = async (req, res) => {
  const { id } = req.params;
  const { adminId } = req.query;
  const { authorization } = req.headers;
  try {
    const getAdmin = await Admin.findOne({
      where: {
        iduser: adminId,
      },
    });

    const adminData = await getAdmin["dataValues"];

    await Reimbursement.update(
      {
        accepted_by: [
          { iduser: adminId, nm_user: adminData.nm_user, status: "WAITING" },
        ],
      },
      {
        where: {
          id: id,
        },
      }
    );

    // Get Admin fcm list
    const getAdminFcmData = await User.findOne({
      where: { iduser: adminId },
    });

    let adminFCM = "";

    if (getAdminFcmData) {
      const adminSession = await getAdminFcmData["dataValues"];
      adminFCM = adminSession.fcmToken;
    }

    const userData = decodeToken(getToken(authorization));

    sendSingleMessage(adminFCM, {
      title: "Ada pengajuan request of payment baru!",
      body: `${userData?.nm_user} telah mengajukan permintaan request of payment!`,
    });

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.reupload_attachment = async (req, res) => {
  const { file, attachment } = req.body;
  const { id } = req.params;

  try {
    let uploadAttachment;

    console.log("FILE", file);

    if (file.type !== "application/pdf") {
      console.log("IMAGE FILE");
      const upload = await uploadImagesCloudinary(attachment);
      uploadAttachment = upload.secure_url;
    } else {
      console.log("PDF File");
      //const upload = await uploadToDrive(attachment, file.name);
      const upload = await uploadToCPanel(attachment, file.name);
      uploadAttachment = upload;
    }

    await Reimbursement.update(
      {
        attachment: uploadAttachment,
        file_info: file,
      },
      {
        where: {
          id: id,
        },
      }
    );

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.reupload_by_doc_attachment = async (req, res) => {
  const { file, attachment } = req.body;
  const { no_doc } = req.query;

  try {
    const getRR = await Reimbursement.findOne({
      where: {
        no_doc: no_doc,
      },
    });

    if (!getRR) {
      console.log(error);
      Responder(res, "ERROR", "No. Dokumen tidak ditemukan.", null, 500);
      return;
    }

    let uploadAttachment;

    if (file.type !== "application/pdf") {
      console.log("IMAGE FILE");
      const upload = await uploadImagesCloudinary(attachment);
      uploadAttachment = upload.secure_url;
    } else {
      console.log("PDF File");
      //const upload = await uploadToDrive(attachment, file.name);
      const upload = await uploadToCPanel(attachment, file.name);
      uploadAttachment = upload;
    }

    await Reimbursement.update(
      {
        attachment: uploadAttachment,
        file_info: file,
      },
      {
        where: {
          no_doc: no_doc,
        },
      }
    );

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.acceptance_multi = async (req, res) => {
  const { ids } = req.body;
  const { authorization } = req.headers;

  try {
    const userData = decodeToken(getToken(authorization));
    const userId = userData.iduser;

    const currentDate = moment().format("DD-MM-YYYY");
    const current_date = moment().format("YYYY-MM-DD HH:mm:ss").toString();

    let reviewerTokens = [];

    const reviewer = await User.findAll({
      where: {
        type: "REVIEWER",
      },
      attributes: ["fcmToken"],
    });

    reviewer.every((res) => reviewerTokens.push(res.fcmToken));

    // Accept multiple pengajuan by id
    ids.map(async (itemId) => {
      const datas = await Reimbursement.findOne({
        where: {
          id: itemId,
        },
      });

      // reimbursement data
      const r_datas = await datas["dataValues"];
      const user_fcm = r_datas["requester"]["fcmToken"];
      const acceptance_by = r_datas["accepted_by"];
      const parentId = r_datas["parentId"];
      const nominal = r_datas["nominal"];
      const extNote = r_datas.note;

      addAdminApprovalDate(acceptance_by, userId, currentDate);

      ubahDataById(acceptance_by, userId, "iduser", "status", "APPROVED");

      if (user_fcm) {
        sendSingleMessage(user_fcm, {
          title: "Pengajuan anda telah setujui!",
          body: `Pengajuan request of payment anda telah disetujui oleh ${
            userData?.nm_user || "penyetuju"
          } dan menunggu diproses.`,
        });
      }

      // === Handle notif to reviewer
      if (reviewerTokens.length > 0) {
        sendMulticastMessage(reviewerTokens, {
          title: "Ada pengajuan request of payment baru!",
          body: `Ada pengajuan request of payment baru yang perlu direview!`,
        });
      }

      const formNote = `${extNote && extNote.length > 0 ? extNote + "||" : ""}${
        userData.nm_user
      }:${""}`;

      await Reimbursement.update(
        {
          accepted_date: current_date,
          accepted_by: acceptance_by,
          status: "APPROVED",
          note: "",
          status_finance: "WAITING",
        },
        {
          where: {
            id: itemId,
          },
        }
      ).then(async () => {
        // Update if has parent ID ( Cash Advance Report )
        if (parentId) {
          await Reimbursement.update(
            {
              realisasi: nominal,
            },
            {
              where: {
                id: parentId,
              },
            }
          );
        }
      });
    });

    Responder(
      res,
      "OK",
      null,
      { updated: true, message: "Pengajuan berhasil di update!" },
      200
    );
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.get_reimbursement_remark = async (req, res) => {
  console.log("REMARK REIMBURSE");
  const {
    page = 1,
    limit = 10,
    monthyear,
    cari,
    type,
    statusCA,
    periodeStart,
    periodeEnd,
    cabang,
  } = req.query;

  try {
    const whereClause = {
      jenis_reimbursement: "Cash Advance",
      status_finance: "DONE",
      childId: {
        [Op.ne]: null,
      },
    };

    if (monthyear) {
      const my = monthyear.split("-");
      const month = my[0];
      const year = my[1];

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (periodeStart && periodeEnd) {
      whereClause.createdAt = {
        [Op.between]: [periodeStart, periodeEnd],
      };
    }

    // status CA
    if (statusCA) {
      if (statusCA == "DONE") {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: "DONE" },
        ];
      } else {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: { [Op.ne]: "DONE" } },
        ];
      }
    }

    // Cabang
    if (cabang) {
      const cabangValues = cabang.split(",");

      whereClause.kode_cabang = {
        [Op.or]: cabangValues.map((value) => ({
          [Op.like]: `${value} -%`,
        })),
      };
    }

    // Tipe Pembayaran
    if (type) {
      if (type == "CASH") {
        whereClause.payment_type = "CASH";
      } else if (type == "TRANSFER") {
        whereClause.payment_type = "TRANSFER";
      }
    }

    if (cari && cari.length > 0) {
      const searchSplit = cari.split(" ");
      const searchConditions = searchSplit.map((item) => ({
        [Op.or]: [
          Sequelize.fn(
            "JSON_CONTAINS",
            Sequelize.col("item"),
            `[{"invoice": "${item}"}]`
          ),
          {
            jenis_reimbursement: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            kode_cabang: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            coa: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            requester_name: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            tipePembayaran: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            no_doc: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            name: {
              [Op.like]: `%${item}%`,
            },
          },
        ],
      }));

      whereClause[Op.and] = searchConditions;
    }

    // Menambahkan pengurutan berdasarkan tipePembayaran
    const orderClause = [
      ["remarked", "ASC"],
      ["tipePembayaran", "DESC"], // Mengurutkan dari Urgent ke Regular
      ["createdAt", "DESC"], // Mengurutkan berdasarkan createdAt secara descending
    ];

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: orderClause,
      include: [
        {
          model: Suplier,
          as: "suplierDetail",
          required: false, // left join
        },
      ],
    });

    // result count
    const resultCount = requested?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    if (requested?.rows.length) {
      Responder(
        res,
        "OK",
        null,
        {
          rows: requested.rows,
          pageInfo: {
            pageNumber: parseInt(page),
            pageLimit: parseInt(limit),
            pageCount: totalPageFormatted,
            pageSize: resultCount,
          },
        },
        200
      );
      return;
    } else {
      Responder(res, "OK", null, [], 200);
      return;
    }
  } catch (error) {
    console.error(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.reviewer_check_remark = async (req, res) => {
  const { id } = req.params;
  const { check } = req.query;
  try {
    await Reimbursement.update(
      {
        remarked: check,
      },
      {
        where: {
          id: id,
        },
      }
    );

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};
