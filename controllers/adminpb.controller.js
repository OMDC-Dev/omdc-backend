const db = require("../db/user.db");
const { Responder } = require("../utils/responder");
const ADMINPB = db.adminpb;
const MUser = db.muser;
const AKSES = db.akses;

exports.add_admin = async (req, res) => {
  const { iduser } = req.params;
  try {
    // GET USER DATA FROM M_USER
    const getUser = await MUser.findOne({
      where: {
        iduser: iduser,
      },
    });

    const userData = await getUser["dataValues"];

    await ADMINPB.create({
      iduser: iduser,
      nm_user: userData.nm_user,
    });

    await AKSES.create({
      idver: iduser + "999123",
      kd_ver: "999123",
      deskripsi: "PermintaanBarang-Admin",
      iduser: iduser,
      flag: "",
    });

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.get_admin = async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  try {
    const offset = (page - 1) * limit;

    const users = await ADMINPB.findAndCountAll({
      limit: parseInt(limit),
      offset: offset,
    });

    // result count
    const resultCount = users?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

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
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.delete_admin = async (req, res) => {
  const { iduser } = req.params;
  try {
    await ADMINPB.destroy({
      where: {
        iduser: iduser,
      },
    });

    await AKSES.destroy({
      where: {
        idver: iduser + "999123",
      },
    });

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
