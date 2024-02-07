const db = require("../db");
const db_user = require("../db/user.db");
const { decodeToken, getToken } = require("../utils/jwt");
const { Responder } = require("../utils/responder");
const { generateRandomNumber, getFormattedDate } = require("../utils/utils");

const M_Cabang = db_user.cabang;
const Reimbursement = db.reimbursement;
const User = db.ruser;

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
      !coa
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

    await Reimbursement.create({
      no_doc: doc_no,
      jenis_reimbursement: getType() || "-",
      tanggal_reimbursement: date || "-",
      kode_cabang: cabang || "-",
      requester_id: userData?.iduser || "-",
      requester_dept: userDetail?.departemen || "-",
      description: description || "-",
      status: "WAITING",
      attachment: attachment || "-",
      bank_detail: JSON.stringify(bank_detail) || "-",
      note: null,
      accepted_date: null,
      accepted_by: null,
      nomor: userDetail?.nomorwa || "-",
      nominal: nominal || "-",
      name: name || "-",
      item: JSON.stringify(item) || "-",
      coa: coa,
    })
      .then((data) => {
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

  try {
    const userData = decodeToken(getToken(authorization));
    const requested = await Reimbursement.findAll({
      where: { requester_id: userData?.iduser },
    });

    Responder(res, "OK", null, requested, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};
