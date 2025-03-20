const { Op, Sequelize } = require("sequelize");
const db = require("../../db/user.db");
const { WORKPLAN_STATUS } = require("../../utils/constants");
const { Responder } = require("../../utils/responder");
const {
  checkUserAuth,
  getUserDatabyToken,
  getFormattedDate,
  generateRandomNumber,
  getCurrentDate,
} = require("../../utils/utils");
const WORKPLAN_DB = db.workplan;
const CABANG_DB = db.cabang;
const USER_SESSION_DB = db.ruser;
const WORKPLAN_DATE_HISTORY_DB = db.workplan_date_history;
const WORKPLAN_COMMENT_DB = db.workplan_comment;

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
    }).then(async (data) => {
      await WORKPLAN_DATE_HISTORY_DB.create({
        wp_id: data.id,
        date: tanggal_selesai,
      });
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
  const { page = 1, limit = 10, status, admin, search, cc, id } = req.query;
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
    if (!admin && !cc && !id) {
      whereCluse.iduser = userData.iduser;
      whereCluse.status = status;
    }

    if (cc && !admin && !id) {
      whereCluse[Op.and] = [
        Sequelize.fn(
          "JSON_CONTAINS",
          Sequelize.col("user_cc"),
          `[{"iduser": "${cc}"}]`
        ),
      ];
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

    let LEFT_JOIN_TABLE = [
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
      {
        model: WORKPLAN_DATE_HISTORY_DB,
        as: "workplant_date_history",
        attributes: ["date"],
      },
    ];

    if (id) {
      whereCluse.iduser = userData.iduser;
      whereCluse.id = id;

      LEFT_JOIN_TABLE.push({
        model: WORKPLAN_DATE_HISTORY_DB,
        as: "workplant_date_history",
        attributes: ["date"],
      });

      LEFT_JOIN_TABLE.push({
        where: { replies_to: null },
        model: WORKPLAN_COMMENT_DB,
        as: "workplant_comment",
        include: [
          {
            model: WORKPLAN_COMMENT_DB,
            as: "replies", // Ambil reply-nya juga
          },
        ],
      });
    }

    const requested = await WORKPLAN_DB.findAndCountAll({
      where: whereCluse,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: [],
      include: LEFT_JOIN_TABLE,
    });

    // result count
    const resultCount = requested?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    const singleResult = requested.rows[0] ?? [];

    Responder(
      res,
      "OK",
      null,
      id
        ? singleResult
        : {
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

// -- Update CC
exports.update_workplan = async (req, res) => {
  const { user_cc, attachment_after, tanggal_selesai } = req.body;
  const { id } = req.params;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    await WORKPLAN_DB.update(
      {
        user_cc: user_cc,
        attachment_after: attachment_after,
        tanggal_selesai: tanggal_selesai,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (tanggal_selesai) {
      await WORKPLAN_DATE_HISTORY_DB.create({
        date: tanggal_selesai,
        wp_id: id,
      });
    }

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

// -- Update After Image
// exports.update_attachment_after = async (req, res) => {
//   const { attachment_after } = req.body;
//   const { id } = req.params;
//   const { authorization } = req.headers;
//   try {
//     const userData = getUserDatabyToken(authorization);
//     const userAuth = checkUserAuth(userData);

//     if (userAuth.error) {
//       return Responder(res, "ERROR", userAuth.message, null, 401);
//     }

//     await WORKPLAN_DB.update(
//       { attachment_after: attachment_after },
//       {
//         where: {
//           id: id,
//         },
//       }
//     );

//     Responder(res, "OK", null, { success: true }, 200);
//     return;
//   } catch (error) {
//     console.log(error);
//     Responder(res, "ERROR", null, null, 400);
//     return;
//   }
// };

exports.update_status = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    await WORKPLAN_DB.update(
      {
        approved_date:
          status != WORKPLAN_STATUS.PENDING && status != WORKPLAN_STATUS.REVISON
            ? getCurrentDate()
            : null,
        status: status,
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
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
