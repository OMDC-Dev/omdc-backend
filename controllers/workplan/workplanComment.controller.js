const db = require("../../db/user.db");
const { Responder } = require("../../utils/responder");
const { getUserDatabyToken, checkUserAuth } = require("../../utils/utils");
const WORKPLAN_COMMENT_DB = db.workplan_comment;

exports.create_comment = async (req, res) => {
  const { id } = req.params;
  const { message, comment_id } = req.body;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    await WORKPLAN_COMMENT_DB.create({
      replies_to: comment_id,
      messsage: message,
      create_by: userData.nm_user,
      wp_id: id,
    });

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

// -- Get Workplan
exports.get_workplan_comment = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
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
