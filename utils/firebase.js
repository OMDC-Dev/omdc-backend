// import firebase-admin package
const admin = require("firebase-admin");

const sendMessaging = () => {
  try {
    return admin.messaging();
  } catch (error) {
    console.log(error);
  }
};

const sendSingleMessage = (token, notification) => {
  return admin
    .messaging()
    .send({
      token: token,
      notification: notification,
    })
    .then((data) => {
      console.log("Send notification success with ", data);
    })
    .catch((err) => {
      console.log("Send notification error with ", err);
    });
};

const sendMulticastMessage = (tokens, notification) => {
  return admin
    .messaging()
    .sendEachForMulticast({ tokens: tokens, notification: notification })
    .then((data) => {
      console.log("Send notification success with ", data);
    })
    .catch((err) => {
      console.log("Send notification error with ", err);
    });
};

module.exports = {
  sendMessaging,
  sendSingleMessage,
  sendMulticastMessage,
};
