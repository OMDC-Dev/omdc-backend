const db_user = require("../db/user.db");
const {
  sendMulticastMessage,
  sendSingleMessage,
} = require("../utils/firebase");
const { Responder } = require("../utils/responder");
const User = db_user.ruser;
const { Op, Sequelize, literal } = require("sequelize");

// Create and Save
exports.create = (req, res) => {};

exports.getDevs = async (req, res) => {
  let reviewerTokens = [];

  const reviewer = await User.findAll({
    where: {
      type: "REVIEWER",
    },
    attributes: ["fcmToken"],
  });

  reviewer.every((res) => reviewerTokens.push(res.fcmToken));

  sendMulticastMessage(reviewerTokens, {
    title: "Ada pengajuan request of payment baru!",
    body: `telah mengajukan request of payment dan perlu direview!`,
  });
};

exports.sendNotif = async (req, res) => {
  const { fcm } = req.body;
  try {
    console.log("NOTIF");
    sendSingleMessage(fcm, {
      title: "Test Notif",
      body: `Dev Notif`,
    });

    sendMulticastMessage([fcm], {
      title: "Test Multi Notif",
      body: `Dev Multi Notif`,
    });

    Responder(res, "OK", null, { success: true }, 200);
  } catch (error) {
    console.log(error);
    return;
  }
};

exports.get_admin_token = async (req, res) => {
  try {
    const sessions = await User.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("fcmToken")), "fcmToken"],
      ],
      where: Sequelize.literal(`JSON_CONTAINS(kodeAkses, '"1200"')`),
    });

    // ubah hasil ke array fcmToken
    const fcmTokens = sessions.map((session) => session.fcmToken);

    Responder(res, "OK", null, fcmTokens, 200);
    return;
  } catch (error) {
    console.log(error);
    return;
  }
};
