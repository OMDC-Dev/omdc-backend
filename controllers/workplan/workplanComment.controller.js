const db = require("../../db/user.db");
const { Op, Sequelize } = require("sequelize");
const { uploadImagesCloudinary } = require("../../utils/cloudinary");
const {
  sendSingleMessage,
  sendMulticastMessage,
} = require("../../utils/firebase");
const { Responder } = require("../../utils/responder");
const { getUserDatabyToken, checkUserAuth } = require("../../utils/utils");
const WORKPLAN_COMMENT_DB = db.workplan_comment;
const WORKPLAN_DB = db.workplan;
const USER_SESSION_DB = db.ruser;

exports.create_comment = async (req, res) => {
  const { id } = req.params;
  const { message, comment_id, attachment } = req.body;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    let UPLOAD_IMAGE;

    if (attachment) {
      UPLOAD_IMAGE = await uploadImagesCloudinary(attachment);
    }

    const comment = await WORKPLAN_COMMENT_DB.create({
      replies_to: comment_id,
      message: message,
      create_by: userData.nm_user,
      iduser: userData.iduser,
      attachment: UPLOAD_IMAGE?.secure_url ?? "",
      wp_id: id,
    });

    // send notif
    const getWP = await WORKPLAN_DB.findOne({
      where: { id: id },
      include: [
        {
          model: USER_SESSION_DB,
          as: "cc_users",
          required: false,
          attributes: ["iduser"],
        },
      ],
    });
    const getWPData = await getWP["dataValues"];
    const mappedCCUser = getWPData.cc_users.map(
      (item) => item?.dataValues?.iduser
    );
    const workplanCreatorId = getWPData.iduser;

    const getUserCorelated = [...mappedCCUser, workplanCreatorId];

    // get user fcm
    let fcmTokens;

    const usersWithToken = await USER_SESSION_DB.findAll({
      attributes: ["fcmToken"],
      where: { iduser: getUserCorelated }, // Ambil semua user yang ada dalam CC
      raw: true,
    });

    // 5. Ambil hanya token yang valid
    fcmTokens = usersWithToken.map((user) => user.fcmToken).filter(Boolean);

    console.log("FCM C User", fcmTokens);

    // 6. Kirim Notifikasi jika ada FCM Token
    if (fcmTokens.length > 0) {
      console.log("SEND TO USER");
      sendSingleMessage(
        fcmTokens[0],
        {
          title: `Ada komentar baru pada work in progress anda!`,
          body: `${userData.nm_user} baru saja menambahkan komentar.`,
        },
        {
          name: "WorkplanStack",
          screen: "WorkplanDetail",
          params: JSON.stringify({
            id: id.toString(),
          }),
        }
      );
    }

    // Send Notif to admin
    const adminSessions = await USER_SESSION_DB.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("fcmToken")), "fcmToken"],
      ],
      where: Sequelize.literal(`JSON_CONTAINS(kodeAkses, '"1200"')`),
    });

    // ubah hasil ke array fcmToken
    const adminFcmTokens = adminSessions.map((session) => session.fcmToken);

    if (adminFcmTokens.length > 0) {
      sendMulticastMessage(
        adminFcmTokens,
        {
          title: `Ada komentar baru di work in progress ${getWPData?.workplan_id}`,
          body: `${userData.nm_user} telah menambahkan komentar baru di work in progress ${getWPData?.workplan_id}`,
        },
        {
          name: "WorkplanStack",
          screen: "WorkplanDetail",
          params: JSON.stringify({
            id: id.toString(),
            admin: "1",
          }),
        }
      );
    }

    Responder(res, "OK", null, { success: true, data: comment }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

// -- Get Workplan
exports.get_workplan_comment = async (req, res) => {
  const { page = 1, limit = 500 } = req.query;
  const { authorization } = req.headers;
  const { id } = req.params;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await WORKPLAN_COMMENT_DB.findAndCountAll({
      limit: parseInt(limit),
      offset: offset,
      order: [],
      where: { replies_to: null, wp_id: id },
      include: [
        {
          model: WORKPLAN_COMMENT_DB,
          as: "replies",
          order: [["createdAt", "DESC"]],
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

exports.count_comment = async (req, res) => {
  const { id } = req.params;
  try {
    const commentCount = await WORKPLAN_COMMENT_DB.count({
      where: {
        wp_id: id,
      },
    });

    Responder(res, "OK", null, { success: true, count: commentCount }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
