const db_user = require("../db/user.db");
const { encPassword } = require("../utils/encPass");
const { generateAccessToken, decodeToken, getToken } = require("../utils/jwt");
const { Responder } = require("../utils/responder");
const { getFormattedDate } = require("../utils/utils");
const R_User = db_user.ruser;

// Main User
const M_User = db_user.muser;

// Admin
const Admin = db_user.superuser;

// Akses
const Akses = db_user.akses;

exports.login = async (req, res) => {
  const { iduser, password, fcmToken, isWeb } = req.body;
  // validate request
  if (!iduser || !password) {
    return Responder(
      res,
      "ERROR",
      "UserId atau Password tidak boleh kosong",
      null
    );
  }

  // check is admin
  const getAdmin = await Admin.findOne({ where: { iduser: iduser } });

  if (getAdmin) {
    console.log("ADMIN LOGIN");
    return loginAsAdmin(req, res, getAdmin, fcmToken);
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

  const userStatus = user.status.toLowerCase();

  if (userStatus !== "aktif") {
    return Responder(
      res,
      "ERROR",
      "Pengguna tidak aktif, silahkan hubungi admin!",
      null,
      404
    );
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

  // get user access
  const aksesUser = await Akses.findAll({
    where: {
      iduser: iduser,
    },
  });

  let kodeAkses = [];

  for (let i = 0; i < aksesUser.length; i++) {
    const kode = aksesUser[i].kd_ver;
    kodeAkses.push(kode);
  }

  // generate token
  const token = generateAccessToken(user);

  delete user["password"];
  delete user["flag"];

  // check if already on session
  const getSession = await R_User.findOne({ where: { iduser: iduser } });

  if (getSession) {
    const existingUser = await getSession["dataValues"];

    // if (existingUser.userToken && !isWeb) {
    //   return Responder(
    //     res,
    //     "ERROR",
    //     "Pengguna sudah login ditempat lain.",
    //     null,
    //     404
    //   );
    // }

    let newToken = "";

    const exFcmToken = existingUser.fcmToken;

    if (fcmToken) {
      newToken = fcmToken;
    } else {
      newToken = exFcmToken;
    }

    return await R_User.update(
      { userToken: token, fcmToken: newToken, kodeAkses: kodeAkses },
      { where: { iduser: iduser } }
    )
      .then(() => {
        const newSession = {
          ...existingUser,
          userToken: token,
          kodeAkses: kodeAkses,
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
      userToken: "",
      isProfileComplete: false,
      nomorwa: "",
      departemen: "",
      fcmToken: fcmToken || "",
      isAdmin: false,
      type: "USER",
      kodeAkses: kodeAkses,
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
  const { nomorwa, departemen } = req.body;
  const { id } = req.params;

  const userId = id;

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
      getUserToken();
    })
    .catch((err) => {
      Responder(res, "ERROR", null, null, 400);
      return;
    });

  async function getUserToken() {
    // get user
    const getUser = await M_User.findOne({ where: { iduser: userId } });
    const user = await getUser["dataValues"];

    // generate token
    const token = generateAccessToken(user);
    delete user["password"];
    delete user["flag"];

    await R_User.update(
      { userToken: token },
      {
        where: { iduser: userId },
      }
    );

    Responder(res, "OK", null, { ...user, userToken: token }, 200);
    return;
  }
};

// login as admin
async function loginAsAdmin(req, res, admin, fcmToken) {
  const { iduser, password, isWeb } = req.body;

  const adminData = admin["dataValues"];

  // hashing password
  const hashPassword = encPassword(password);

  if (hashPassword !== adminData.password) {
    return Responder(
      res,
      "ERROR",
      "Pengguna atau password tidak sesuai!",
      null,
      401
    );
  }

  // get user access
  const aksesUser = await Akses.findAll({
    where: {
      iduser: iduser,
    },
  });

  let kodeAkses = [];

  for (let i = 0; i < aksesUser.length; i++) {
    const kode = aksesUser[i].kd_ver;
    kodeAkses.push(kode);
  }

  // generate token
  const token = generateAccessToken(adminData);

  // check if already on session
  const getSession = await R_User.findOne({ where: { iduser: iduser } });

  if (getSession) {
    const existingUser = await getSession["dataValues"];

    // if (existingUser.userToken && !isWeb) {
    //   return Responder(
    //     res,
    //     "ERROR",
    //     "Pengguna sudah login ditempat lain.",
    //     null,
    //     404
    //   );
    // }

    let newToken = "";

    const exFcmToken = existingUser.fcmToken;

    if (fcmToken) {
      newToken = fcmToken;
    } else {
      newToken = exFcmToken;
    }

    return await R_User.update(
      {
        userToken: token,
        fcmToken: newToken,
        kodeAkses: kodeAkses,
        isAdmin: 1,
        type: adminData.type,
      },
      { where: { iduser: iduser } }
    )
      .then(() => {
        const newSession = {
          ...existingUser,
          userToken: token,
          kodeAkses: kodeAkses,
          isAdmin: 1,
          type: adminData.type,
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
      ...adminData,
      tgl_trans: getFormattedDate(new Date(), "-"),
      user_add: "System",
      status: "Aktif",
      userToken: "",
      isProfileComplete: false,
      nomorwa: "",
      departemen: "",
      fcmToken: fcmToken || "-",
      isAdmin: true,
      kodeAkses: kodeAkses,
    })
      .then((data) => {
        Responder(res, "OK", null, data, 200);
        return;
      })
      .catch((err) => {
        console.log(err);
        Responder(res, "ERROR", null, null, 400);
        return;
      });
  }
}

exports.updatePw = async (req, res) => {
  const { authorization } = req.headers;
  const { lastPassword, newPassword } = req.body;
  try {
    const tokenData = decodeToken(getToken(authorization));

    // get user data
    const getUserData = await M_User.findOne({
      where: {
        iduser: tokenData.iduser,
      },
    });

    const userData = await getUserData["dataValues"];
    const userPassword = userData.password;

    const encodedLastPw = encPassword(lastPassword);

    if (userPassword !== encodedLastPw) {
      Responder(
        res,
        "ERROR",
        "Password lama tidak sesuai, mohon periksa kembali!",
        null,
        400
      );
      return;
    }

    // update password
    const encodedNewPassword = encPassword(newPassword);

    const getAdmin = await Admin.findOne({
      where: {
        iduser: tokenData.iduser,
      },
    });

    if (getAdmin) {
      console.log("Update SuperUser PW");
      // update for admin
      await Admin.update(
        { password: encodedNewPassword },
        {
          where: {
            iduser: tokenData.iduser,
          },
        }
      );
    }

    // update for user
    return await M_User.update(
      { password: encodedNewPassword },
      {
        where: {
          iduser: tokenData.iduser,
        },
      }
    )
      .then(() => {
        Responder(
          res,
          "OK",
          null,
          { message: "Sukses mengganti password!" },
          200
        );
        return;
      })
      .catch((err) => {
        console.log(err);
        Responder(res, "ERROR", null, null, 400);
        return;
      });
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.logout = async (req, res) => {
  const { authorization } = req.headers;
  const { isWeb } = req.query;
  try {
    const tokenData = decodeToken(getToken(authorization));

    if (isWeb) {
      Responder(res, "OK", null, { message: "Sukses logout!" }, 200);
      return;
    }

    return await R_User.update(
      { fcmToken: "" },
      {
        where: {
          iduser: tokenData.iduser,
        },
      }
    )
      .then(() => {
        Responder(res, "OK", null, { message: "Sukses logout!" }, 200);
        return;
      })
      .catch((err) => {
        Responder(res, "ERROR", null, null, 400);
        return;
      });
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.get_kodeakses_by_id = async (req, res) => {
  const { iduser } = req.params;
  try {
    // get user access
    const aksesUser = await Akses.findAll({
      where: {
        iduser: iduser,
      },
    });

    let kodeAkses = [];

    for (let i = 0; i < aksesUser.length; i++) {
      const kode = aksesUser[i].kd_ver;
      kodeAkses.push(kode);
    }

    Responder(res, "OK", null, { kodeAkses: kodeAkses }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
