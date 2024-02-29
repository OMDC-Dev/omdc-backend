const { Op } = require("sequelize");
const { encPassword } = require("../utils/encPass");
const { decodeToken, getToken } = require("../utils/jwt");
const { Responder } = require("../utils/responder");
const db_user = require("../db/user.db");

// db
const SuperUser = db_user.superuser;
const Reimbursement = db_user.reimbursement;
const User = db_user.ruser;
const MUser = db_user.muser;

// Create and Save
exports.createUser = async (req, res) => {
  const { iduser, departemen, type } = req.body;

  if (!iduser || !departemen || !type) {
    return Responder(res, "ERROR", "Data tidak lengkap!", null);
  }

  // GET USER DATA FROM M_USER
  const getUser = await MUser.findOne({
    where: {
      iduser: iduser,
    },
  });

  const userData = await getUser["dataValues"];

  SuperUser.create({
    iduser: userData?.iduser,
    nm_user: userData?.nm_user,
    level_user: userData?.level_user,
    departemen: departemen,
    password: userData?.password,
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
  const { authorization } = req.headers;
  const { page = 1, limit = 25, get, exceptId } = req.query;
  try {
    const userData = decodeToken(getToken(authorization));

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (!get) {
      whereClause.type = "ADMIN";

      // Menambahkan kondisi untuk exceptId jika diberikan
      if (exceptId) {
        whereClause.iduser = { [Op.not]: [userData?.iduser, exceptId] };
      } else {
        // Jika tidak ada exceptId, maka exclude hanya userData?.iduser
        whereClause.iduser = { [Op.ne]: userData?.iduser };
      }
    }

    const users = await SuperUser.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
    });

    // result count
    const resultCount = users?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    // const filtered = get
    //   ? users?.rows
    //   : users?.rows?.filter((item) => {
    //       return item.iduser !== userData?.iduser;
    //     });

    Responder(
      res,
      "OK",
      null,
      {
        rows: users?.rows,
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
  } catch (error) {
    console.log(error);
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
    if (status) {
      if (status === "01") {
        whereClause.status = { [Op.ne]: "WAITING" }; // Memilih status selain 'APPROVED'
      } else if (status === "00") {
        whereClause.status = "WAITING";
      }
    }

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: [["createdAt", "DESC"]],
    });

    if (requested?.rows.length) {
      // Filter data berdasarkan accepted_by yang mengandung userId
      const requestedFilter = requested?.rows.filter((reimbursement) => {
        const acceptedBy = reimbursement.accepted_by || []; // Mengatasi jika accepted_by null atau undefined
        return acceptedBy.some((item) => item.iduser === userData?.iduser);
      });

      // result count
      const resultCount = requestedFilter?.length;

      const totalPage = resultCount / limit;
      const totalPageFormatted =
        Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

      Responder(
        res,
        "OK",
        null,
        requestedFilter.length
          ? {
              rows: requestedFilter,
              pageInfo: {
                pageNumber: parseInt(page),
                pageLimit: parseInt(limit),
                pageCount: totalPageFormatted,
                pageSize: resultCount,
              },
            }
          : [],
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
    } else if (status === "01") {
      whereClause.status_finance = "DONE";
    }

    whereClause.status = "APPROVED";

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
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    Responder(
      res,
      "OK",
      null,
      {
        rows: requested?.rows,
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

exports.deleteAdmin = async (req, res) => {
  const { iduser } = req.params;

  console.log(`DELETING ${iduser}`);

  try {
    await SuperUser.destroy({
      where: {
        iduser: iduser,
      },
    });

    Responder(res, "OK", null, { message: "Admin berhasil dihapus!" }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.getAllUsers = async (req, res) => {
  const { page = 1, limit = 25, cari } = req.query;

  try {
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (cari) {
      const searchSplit = cari.split(" ");
      whereClause[Op.and] = searchSplit.map((item) => ({
        nm_user: {
          [Op.like]: `%${item}%`,
        },
      }));
    }

    const datas = await MUser.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
    });

    // result count
    const resultCount = datas?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    Responder(
      res,
      "OK",
      null,
      {
        rows: datas.rows,
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
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
