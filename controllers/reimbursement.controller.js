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
    childId,
    parentId,
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
      !file
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

    // Report Parent Doc
    let parentDoc;

    if (parentId) {
      const getParent = await Reimbursement.findOne({
        where: {
          id: parentId,
        },
      });

      const parentData = await getParent["dataValues"];

      parentDoc = parentData.no_doc;
    }

    const getApprovalAdmin = await Admin.findOne({
      where: { iduser: approved_by },
    });

    const admin = await getApprovalAdmin["dataValues"];

    const adminData = {
      iduser: admin.iduser,
      nm_user: admin.nm_user,
      status: "WAITING",
    };

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
      accepted_date: null,
      accepted_by: [adminData],
      nominal: nominal || "-",
      name: name || "-",
      item: item || "-",
      coa: coa,
      file_info: file,
      status_finance: "IDLE",
      finance_by: "",
      realisasi: "",
      childId: childId,
      parentId: parentId,
      parentDoc: parentDoc,
    })
      .then(async (data) => {
        if (parentId) {
          await Reimbursement.update(
            { childId: data?.id },
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
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.get_reimbursement = async (req, res) => {
  const { authorization } = req.headers;
  const { page = 1, limit = 10, monthyear, status } = req.query;

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
    if (status === "00") {
      whereClause.status = { [Op.ne]: "APPROVED" }; // Memilih status selain 'APPROVED'
    } else if (status === "01") {
      whereClause.status = "APPROVED";
    }

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: [["createdAt", "DESC"]],
    });

    // result count
    const resultCount = requested?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.round(totalPage);

    if (requested?.rows.length) {
      Responder(
        res,
        "OK",
        null,
        {
          rows: requested.rows,
          pageInfo: {
            pageNumber: page,
            pageLimit: limit,
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
  const { fowarder_id, status, nominal, note } = req.body;
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
    const acceptance_by = r_datas["accepted_by"];

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
    }

    if (status == "APPROVED") {
      ubahDataById(acceptance_by, userId, "iduser", "status", "APPROVED");
    }

    if (status == "REJECTED") {
      ubahDataById(acceptance_by, userId, "iduser", "status", "REJECTED");
    }

    const current_date =
      status == "APPROVED"
        ? moment(new Date()).format("YYYY-MM-DD HH:mm:ss").toString()
        : "";

    const status_change = status == "FOWARDED" ? "WAITING" : status;

    const status_finance = status == "APPROVED" ? "WAITING" : "IDLE";

    return await Reimbursement.update(
      {
        accepted_date: current_date,
        accepted_by: acceptance_by,
        status: status_change,
        nominal: "Rp. " + nominal,
        note: note,
        status_finance: status_finance,
      },
      {
        where: {
          id: id,
        },
      }
    )
      .then(() => {
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
  const { nominal } = req.body;
  try {
    const userData = decodeToken(getToken(authorization));

    const financeData = {
      nm_user: userData.nm_user,
      iduser: userData?.iduser,
      acceptDate: moment(new Date()).format("YYYY-MM-DD"),
    };

    const getReimburse = await Reimbursement.findOne({
      where: {
        id: id,
      },
    });

    const reimbursementData = await getReimburse["dataValues"];
    const parentId = reimbursementData.parentId;

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

    return await Reimbursement.update(
      {
        status_finance: status,
        finance_by: financeData,
      },
      {
        where: {
          id: id,
        },
      }
    )
      .then(() => {
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
  try {
    const getReim = await Reimbursement.findOne({
      where: {
        id: id,
      },
    });

    const reimData = await getReim["dataValues"];

    Responder(res, "OK", null, reimData, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
