const db = require("../db/user.db");
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

    for (let i = 0; i < userSessionList.length; i++) {
      const uid = userSessionList[i].iduser;

      await Pengumuman.create({
        pid: PID,
        title: title,
        message: message,
        receiver: uid,
        isRead: false,
        createdBy: creatorId,
      });
    }

    Responder(res, "OK", null, { message: "Pengumuman berhasil dibuat!" }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.getPengumuman = async (req, res) => {
  const { authorization } = req.headers;

  try {
    const userData = decodeToken(getToken(authorization));

    const datas = await Pengumuman.findAll({
      where: {
        receiver: userData?.iduser,
      },
      order: [["createdAt", "DESC"]],
    });

    Responder(res, "OK", null, datas, 200);
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
