const db = require("../db/user.db");
const { sendMulticastMessage } = require("../utils/firebase");
const { decodeToken, getToken } = require("../utils/jwt");
const { Responder } = require("../utils/responder");
const { generateRandomNumber } = require("../utils/utils");

const Pengumuman = db.pengumuman;
const User = db.ruser;

exports.createPengumuman = async (req, res) => {
  const { authorization } = req.headers;
  const { title, message } = req.body;

  const PID = `PID-${generateRandomNumber(1000, 9999)}`;

  const getCreator = decodeToken(getToken(authorization));
  const creatorId = getCreator.iduser;

  try {
    const userSessionList = await User.findAll();

    let fcmToken = [];

    for (let i = 0; i < userSessionList.length; i++) {
      const uid = userSessionList[i].iduser;
      fcmToken.push(userSessionList[i].fcmToken);

      await Pengumuman.create({
        pid: PID,
        title: title,
        message: message,
        receiver: uid,
        isRead: false,
        createdBy: creatorId,
      });
    }

    fcmToken = fcmToken.filter((item) => {
      return item.length > 0;
    });

    // send notification
    if (fcmToken?.length) {
      sendMulticastMessage(fcmToken, {
        title: "Ada pengumuman baru!",
        body: title,
      });
    }

    Responder(res, "OK", null, { message: "Pengumuman berhasil dibuat!" }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.getPengumuman = async (req, res) => {
  const { authorization } = req.headers;
  const { page = 1, limit = 25, owner } = req.query;

  try {
    const userData = decodeToken(getToken(authorization));

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (owner) {
      whereClause.createdBy = owner;
    }

    whereClause.receiver = userData?.iduser;

    const datas = await Pengumuman.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    // result count
    const resultCount = datas?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.round(totalPage);

    Responder(
      res,
      "OK",
      null,
      {
        rows: datas.rows,
        pageInfo: {
          pageNumber: page,
          pageLimit: limit,
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

exports.deletePengumuman = async (req, res) => {
  const { pid } = req.params;

  try {
    await Pengumuman.destroy({
      where: {
        pid: pid,
      },
    });

    Responder(
      res,
      "OK",
      null,
      { message: "Pengumuman berhasil dihapus!" },
      200
    );
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.getPengumumanCount = async (req, res) => {
  const { authorization } = req.headers;

  try {
    const userData = decodeToken(getToken(authorization));

    const datas = await Pengumuman.findAll({
      where: {
        receiver: userData?.iduser,
        isRead: false,
      },
    });

    Responder(res, "OK", null, { unreadCount: datas.length }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.readPengumuman = async (req, res) => {
  const { id } = req.params;

  try {
    await Pengumuman.update({ isRead: true }, { where: { id: id } });

    Responder(res, "OK", null, { message: "Pengumuman telah dibaca!" }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
