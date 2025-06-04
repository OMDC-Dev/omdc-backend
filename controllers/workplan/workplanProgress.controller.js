const db = require("../../db/user.db");
const { Op, Sequelize } = require("sequelize");
const { WORKPLAN_STATUS } = require("../../utils/constants");
const { Responder } = require("../../utils/responder");
const {
  getUserDatabyToken,
  checkUserAuth,
  getCurrentDate,
} = require("../../utils/utils");
const { sendMulticastMessage } = require("../../utils/firebase");
const WORKPLAN_PROGRESS_DB = db.workplan_progress;
const WORKPLAN_DB = db.workplan;
const USER_SESSION_DB = db.ruser;

exports.create_wp_progress = async (req, res) => {
  const { progress } = req.body;
  const { wp_id } = req.params;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    await WORKPLAN_PROGRESS_DB.create({
      progress,
      wp_id,
      created_by: userData.nm_user,
    });

    const getExt = await WORKPLAN_DB.findOne({
      where: {
        id: wp_id,
      },
    });

    await WORKPLAN_DB.update(
      {
        last_update: getCurrentDate(),
        last_update_by: userData.nm_user,
      },
      {
        where: {
          id: wp_id,
        },
      }
    );

    const getExtData = await getExt["dataValues"];

    if (getExtData.status == WORKPLAN_STATUS.REVISON) {
      await WORKPLAN_DB.update(
        { status: WORKPLAN_STATUS.ON_PROGRESS },
        { where: { id: wp_id } }
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
          title: `Ada update progress work in progress`,
          body: `${userData.nm_user} telah menambahkan progress baru ke work in progress ${wp_id}\n\nProgress: ${progress}`,
        },
        {
          name: "WorkplanStack",
          screen: "WorkplanDetail",
          params: JSON.stringify({
            id: wp_id.toString(),
            admin: "1",
          }),
        }
      );
    }

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.update_wp_progress = async (req, res) => {
  const { progress, wp_id } = req.body;
  const { id } = req.params;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    await WORKPLAN_PROGRESS_DB.update(
      {
        progress,
      },
      {
        where: {
          id: id,
        },
      }
    );

    const getExt = await WORKPLAN_DB.findOne({
      where: {
        id: wp_id,
      },
    });

    await WORKPLAN_DB.update(
      {
        last_update: getCurrentDate(),
        last_update_by: userData.nm_user,
      },
      {
        where: {
          id: wp_id,
        },
      }
    );

    const getExtData = await getExt["dataValues"];

    if (getExtData.status == WORKPLAN_STATUS.REVISON) {
      await WORKPLAN_DB.update(
        { status: WORKPLAN_STATUS.ON_PROGRESS },
        { where: { id: wp_id } }
      );
    }

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.delete_wp_progress = async (req, res) => {
  const { id } = req.params;
  const { authorization } = req.headers;
  const { wp_id } = req.body;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    await WORKPLAN_PROGRESS_DB.destroy({
      where: {
        id: id,
      },
    });

    const getExt = await WORKPLAN_DB.findOne({
      where: {
        id: wp_id,
      },
    });

    await WORKPLAN_DB.update(
      {
        last_update: getCurrentDate(),
        last_update_by: userData.nm_user,
      },
      {
        where: {
          id: wp_id,
        },
      }
    );

    const getExtData = await getExt["dataValues"];

    if (getExtData.status == WORKPLAN_STATUS.REVISON) {
      await WORKPLAN_DB.update(
        { status: WORKPLAN_STATUS.ON_PROGRESS },
        { where: { id: wp_id } }
      );
    }

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.get_wp_progress = async (req, res) => {
  const { wp_id } = req.params;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    const data = await WORKPLAN_PROGRESS_DB.findAll({
      where: {
        wp_id: wp_id,
      },
    });

    Responder(res, "OK", null, data, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};
