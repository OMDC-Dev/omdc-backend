// import firebase-admin package
const admin = require("firebase-admin");

const sendMessaging = () => {
  try {
    return admin.messaging();
  } catch (error) {
    console.log(error);
  }
};

const sendSingleMessage = (token, notification, data = {}) => {
  if (!token) return;
  return admin
    .messaging()
    .send({
      token: token,
      notification: notification,
      data: data,
      apns: {
        payload: {
          aps: {
            // Required for background/quit data-only messages on iOS
            // Note: iOS frequently will receive the message but decline to deliver it to your app.
            //           This is an Apple design choice to favor user battery life over data-only delivery
            //           reliability. It is not under app control, though you may see the behavior in device logs.
            "content-available": true,
            // Required for background/quit data-only messages on Android
            priority: "high",
          },
        },
      },
    })
    .then((data) => {
      console.log("Send notification success with ", data);
    })
    .catch((err) => {
      console.log("Send notification error with ", err);
    });
};

const sendMulticastMessage = (tokens, notification, data = {}) => {
  if (!tokens) return;

  const cleanTokens = tokens.filter((token) => !!token);

  return admin
    .messaging()
    .sendEachForMulticast({
      tokens: cleanTokens,
      notification: notification,
      data: data,
      apns: {
        payload: {
          aps: {
            // Required for background/quit data-only messages on iOS
            // Note: iOS frequently will receive the message but decline to deliver it to your app.
            //           This is an Apple design choice to favor user battery life over data-only delivery
            //           reliability. It is not under app control, though you may see the behavior in device logs.
            "content-available": true,
            // Required for background/quit data-only messages on Android
            priority: "high",
          },
        },
      },
    })
    .then((data) => {
      console.log("Send notification success with ", data);
      console.log(data.responses[0].error);
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
