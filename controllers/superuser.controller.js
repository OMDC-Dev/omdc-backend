const { Op } = require("sequelize");
const db = require("../db");
const { encPassword } = require("../utils/encPass");
const { decodeToken, getToken } = require("../utils/jwt");
const { Responder } = require("../utils/responder");

// db
const SuperUser = db.superuser;
const Reimbursement = db.reimbursement;
const User = db.ruser;

// Create and Save
exports.createUser = (req, res) => {
  const { iduser, nm_user, level_user, departemen, password, type } = req.body;

  if (!iduser || !nm_user || !level_user || !departemen || !password || !type) {
    return Responder(res, "ERROR", "Data tidak lengkap!", null);
  }

  const encPass = encPassword(password);

  SuperUser.create({
    iduser,
    nm_user,
    level_user,
    departemen,
    password: encPass,
    type: type,
  })
    .then((data) => {
      Responder(res, "OK", null, data, 200);
      return;
    })
    .catch((err) => {
      Responder(res, "ERROR", null, null, 400);
      return;
    });
};

exports.getUser = async (req, res) => {
  try {
    const users = await SuperUser.findAll({
      where: {
        type: "ADMIN",
      },
    });
    Responder(res, "OK", null, users, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.get_pengajuan = async (req, res) => {
  const { authorization } = req.headers;
  const { page = 1, limit = 10, monthyear, status } = req.query;

  try {
    const userData = decodeToken(getToken(authorization));

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

    // Menambahkan filter berdasarkan status jika diberikan
    if (status === "00") {
      whereClause.status = { [Op.ne]: "APPROVED" }; // Memilih status selain 'APPROVED'
    } else if (status === "01") {
      whereClause.status = "APPROVED";
    }

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: [["createdAt", "DESC"]],
    });

    if (requested.length) {
      // Filter data berdasarkan accepted_by yang mengandung userId
      const requestedFilter = requested.filter((reimbursement) => {
        const acceptedBy = reimbursement.accepted_by || []; // Mengatasi jika accepted_by null atau undefined
        return acceptedBy.some((item) => item.iduser === userData?.iduser);
      });

      Responder(
        res,
        "OK",
        null,
        requestedFilter.length ? requestedFilter : [],
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

exports.get_pengajuan_finance = async (req, res) => {
  const { authorization } = req.headers;
  const { page = 1, limit = 10, monthyear, status } = req.query;

  try {
    const userData = decodeToken(getToken(authorization));

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

    // Menambahkan filter berdasarkan status jika diberikan
    if (status === "00") {
      whereClause.status_finance = { [Op.ne]: "DONE" }; // Memilih status selain 'APPROVED'
      whereClause.status = "APPROVED";
    } else if (status === "01") {
      whereClause.status_finance = "DONE";
    }

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: [["createdAt", "DESC"]],
    });

    Responder(res, "OK", null, requested, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.getUserDetail = async (req, res) => {
  const { id } = req.query;

  try {
    const user = await User.findOne({ where: { iduser: id } });
    const userData = await user["dataValues"];

    delete userData.userToken;

    Responder(res, "OK", null, userData, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
