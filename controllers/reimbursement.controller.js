const { Op } = require("sequelize");
const db_user = require("../db/user.db");
const { decodeToken, getToken } = require("../utils/jwt");
const { Responder } = require("../utils/responder");
const {
  generateRandomNumber,
  getFormattedDate,
  ubahDataById,
} = require("../utils/utils");
const moment = require("moment");
require("moment/locale/id");
moment.locale("id");
const {
  sendSingleMessage,
  sendMulticastMessage,
} = require("../utils/firebase");

const M_Cabang = db_user.cabang;
const Reimbursement = db_user.reimbursement;
const User = db_user.ruser;
const Admin = db_user.superuser;

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
  } = req.body;
  try {
    if (
      !type ||
      !date ||
      !cabang ||
      !description ||
      !attachment ||
      !bank_detail ||
      !nominal ||
      !item ||
      !coa ||
      !approved_by ||
      !file ||
      !payment_type
    ) {
      return Responder(res, "ERROR", "Data tidak lengkap!", null, 400);
    }

    const userData = decodeToken(getToken(authorization));

    const doc_no = `RR-${getFormattedDate()}-${generateRandomNumber(
      1000,
      9999
    )}`;

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

    await Reimbursement.create({
      no_doc: doc_no,
      jenis_reimbursement: getType() || "-",
      tanggal_reimbursement: date || "-",
      kode_cabang: `${cabangData["kd_induk"]} - ${cabangData["nm_induk"]}`,
      requester_id: userDetail.iduser || "-",
      requester: userDetail || "-",
      description: description || "-",
      status: "WAITING",
      attachment: attachment || "-",
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
    })
      .then(async (data) => {
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
        title: "Ada pengajuan reimbursement baru!",
        body: `${userDetail?.nm_user} telah mengajukan permintaan reimbursement!`,
      });
    }
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.get_reimbursement = async (req, res) => {
  const { authorization } = req.headers;
  const { page = 1, limit = 10, monthyear, status, cari } = req.query;

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

    // Menambahkan filter berdasarkan status jika diberikan
    if (status === "01") {
      // whereClause.status = { [Op.ne]: "WAITING" }; // Memilih status selain 'APPROVED'
      whereClause[Op.or] = [
        {
          status: "APPROVED",
          status_finance: "DONE",
          status_finance_child: "DONE",
        },
        {
          status: "REJECTED",
        },
      ];
    } else if (status === "00") {
      whereClause[Op.or] = [
        { status: "WAITING" },
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

exports.acceptance = async (req, res) => {
  const { id } = req.params;
  const { fowarder_id, status, nominal, note, coa } = req.body;
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
          title: "Ada pengajuan reimbursement baru!",
          body: `Ada pengajuan reimbursement yang diteruskan dan menunggu persetujuan anda.`,
        });
      }
    }

    if (status == "APPROVED") {
      ubahDataById(acceptance_by, userId, "iduser", "status", "APPROVED");

      console.log("USER FCM", user_fcm);

      if (user_fcm) {
        sendSingleMessage(user_fcm, {
          title: "Pengajuan anda telah setujui!",
          body: `Pengajuan reimbursement anda telah disetujui oleh ${
            userData?.nm_user || "penyetuju"
          } dan menunggu diproses.`,
        });
      }

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
            title: "Ada pengajuan reimbursement baru!",
            body: "Ada pengajuan reimbursement yang telah disetujui oleh penyetuju dan menunggu untuk diproses!",
          });
        }
      }
    }

    if (status == "REJECTED") {
      ubahDataById(acceptance_by, userId, "iduser", "status", "REJECTED");

      if (user_fcm) {
        sendSingleMessage(user_fcm, {
          title: "Pengajuan anda telah tolak!",
          body: `Pengajuan reimbursement anda telah ditolak oleh ${
            userData?.nm_user || "penyetuju"
          }.`,
        });
      }

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

    return await Reimbursement.update(
      {
        accepted_date: current_date,
        accepted_by: acceptance_by,
        status: status_change,
        nominal: "Rp. " + nominal,
        note: note || "",
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
      ],
    });

    const dataStatus = await data["dataValues"];

    Responder(res, "OK", null, dataStatus, 200);
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
  const { nominal, note, coa, bank } = req.body;
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

    const IS_CONFIRM_ONLY = !bankDetail?.accountname?.length;

    const userFcm = userRequested.fcmToken;

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

    return await Reimbursement.update(
      {
        status_finance: status,
        status_finance_child: jenis == "Cash Advance" ? "IDLE" : status,
        finance_by: financeData,
        finance_note: note || "-",
        coa: coa,
        finance_bank: bank || "-",
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
            title: "Pengajuan reimbursement anda telah di proses finance!",
            body: IS_CONFIRM_ONLY
              ? `Laporan anda telah diterima oleh ${financeData.nm_user} - tim finance`
              : `Pengajuan reimbursement anda telah diproses oleh ${financeData?.nm_user} sebesar ${nominal}`,
          });
        }
        return Responder(res, "OK", null, { updated: true }, 200);
      })
      .catch((err) => {
        return Responder(res, "ERROR", null, { updated: true }, 400);
      });
  } catch (error) {
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
    };

    if (type && type == "VALUE") {
      condition.attributes = ["nominal", "realisasi"];
    }

    const getReim = await Reimbursement.findOne(condition);

    const reimData = await getReim["dataValues"];

    Responder(res, "OK", null, reimData, 200);
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
  const { page = 1, limit = 10, monthyear, status, cari } = req.query;

  try {
    const whereClause = {};

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
