const db = require("../../db/user.db");
const { Responder } = require("../../utils/responder");
const WORKPLAN_PROGRESS_DB = db.workplan_progress;

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
    });

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.delete_wp_progress = async (req, res) => {
  const { id } = req.params;
  const { authorization } = req.headers;
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
