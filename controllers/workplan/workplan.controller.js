const { Op, Sequelize } = require("sequelize");
const db = require("../../db/user.db");
const { WORKPLAN_STATUS } = require("../../utils/constants");
const { Responder } = require("../../utils/responder");
const {
  checkUserAuth,
  getUserDatabyToken,
  getFormattedDate,
  generateRandomNumber,
} = require("../../utils/utils");
const WORKPLAN_DB = db.workplan;
const CABANG_DB = db.cabang;
const USER_SESSION_DB = db.ruser;

// --  Create work plan
exports.create_workplan = async (req, res) => {
  const {
    jenis_workplan,
    tanggal_mulai,
    tanggal_selesai,
    kd_induk,
    perihal,
    kategori,
    user_cc,
    attachment_before,
    attachment_after,
  } = req.body;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    const WORKPLAN_ID = `WP-${getFormattedDate()}-${generateRandomNumber(
      1000000,
      9999999
    )}`;

    await WORKPLAN_DB.create({
      workplan_id: WORKPLAN_ID,
      jenis_workplan,
      tanggal_mulai,
      tanggal_selesai,
      kd_induk,
      perihal: perihal.toUpperCase(),
      kategori: kategori.toUpperCase(),
      iduser: userData.iduser,
      user_cc,
      attachment_before,
      attachment_after,
      status: WORKPLAN_STATUS.ON_PROGRESS,
    });

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

// -- Get Workplan
exports.get_workplan = async (req, res) => {
  const { page = 1, limit = 10, status, admin, search } = req.query;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    let whereCluse = {};

    // -- handle if user
    if (!admin) {
      whereCluse.iduser = userData.iduser;
      whereCluse.status = status;
    }

    // -- search
    if (search) {
      whereCluse[Op.or] = [
        { workplan_id: { [Op.like]: `%${search}%` } },
        { perihal: { [Op.like]: `%${search}%` } },
        { kd_induk: { [Op.like]: `%${search}%` } },
        { "$cabang_detail.nm_induk$": { [Op.like]: `%${search}%` } },
        { "$user_detail.nm_user$": { [Op.like]: `%${search}%` } },
      ];
    }

    const requested = await WORKPLAN_DB.findAndCountAll({
      where: whereCluse,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: [],
      include: [
        {
          model: CABANG_DB,
          as: "cabang_detail",
          required: false, // left join
          attributes: ["kd_induk", "nm_induk"],
        },
        {
          model: USER_SESSION_DB,
          as: "user_detail",
          required: false, // left join
          attributes: ["nm_user", "fcmToken"],
        },
      ],
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
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
