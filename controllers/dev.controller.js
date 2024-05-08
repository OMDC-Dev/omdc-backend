const db_user = require("../db/user.db");
const { sendMulticastMessage } = require("../utils/firebase");
const User = db_user.ruser;

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
