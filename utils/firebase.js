// import firebase-admin package
const admin = require("firebase-admin");

const sendMessaging = async () => {
  return await admin.messaging();
};

module.exports = {
  sendMessaging,
};
