const db = require("../db");
const db_user = require("../db/user.db");
const { encPassword } = require("../utils/encPass");
const { generateAccessToken, decodeToken, getToken } = require("../utils/jwt");
const { Responder } = require("../utils/responder");
const R_User = db.ruser;

// Main User
const M_User = db_user.muser;

exports.login = async (req, res) => {
  const { iduser, password } = req.body;
  // validate request
  if (!iduser || !password) {
    return Responder(
      res,
      "ERROR",
      "UserId atau Password tidak boleh kosong",
      null
    );
  }

  // get user
  const getUser = await M_User.findOne({ where: { iduser: iduser } });

  if (!getUser) {
    return Responder(res, "ERROR", "Pengguna tidak ditemukan!", null, 404);
  }

  const user = await getUser["dataValues"];

  if (!user) {
    return Responder(res, "ERROR", "Pengguna tidak ditemukan!", null, 404);
  }

  // hashing password
  const hashPassword = encPassword(password);

  if (hashPassword !== user.password) {
    return Responder(
      res,
      "ERROR",
      "Pengguna atau password tidak sesuai!",
      null,
      401
    );
  }

  // generate token
  const token = generateAccessToken(user);

  delete user["password"];
  delete user["flag"];

  // check if already on session
  const getSession = await R_User.findOne({ where: { iduser: iduser } });

  if (getSession) {
    const existingUser = await getSession["dataValues"];

    return await R_User.update(
      { usertoken: token },
      { where: { iduser: iduser } }
    )
      .then(() => {
        const newSession = {
          ...existingUser,
          userToken: token,
        };
        Responder(res, "OK", null, newSession, 200);
        return;
      })
      .catch((err) => {
        console.log(err);
        Responder(res, "ERROR", null, null, 400);
        return;
      });
  } else {
    // save user session
    R_User.create({
      ...user,
      userToken: token,
      isProfileComplete: false,
      nomorwa: "",
      departemen: "",
      fcmToken: "",
    })
      .then((data) => {
        Responder(res, "OK", null, data, 200);
        return;
      })
      .catch((err) => {
        Responder(res, "ERROR", null, null, 400);
        return;
      });
  }
};

exports.completeUser = async (req, res) => {
  const { authorization } = req.headers;
  const { nomorwa, departemen } = req.body;

  const userData = decodeToken(getToken(authorization));
  const userId = userData?.iduser;

  if (!nomorwa || !departemen) {
    return Responder(
      res,
      "ERROR",
      "Nomor WhatsApp dan Departemen tidak boleh kosong!",
      null
    );
  }

  await R_User.update(
    { nomorwa: nomorwa, departemen: departemen, isProfileComplete: true },
    { where: { iduser: userId } }
  )
    .then(() => {
      Responder(res, "OK", null, { message: "Sukses melengkapi data!" }, 200);
      return;
    })
    .catch((err) => {
      Responder(res, "ERROR", null, null, 400);
      return;
    });
};
