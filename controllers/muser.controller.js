const db = require("../db/user.db");
const { Responder } = require("../utils/responder");
const M_User = db.muser;

exports.getUser = async (req, res) => {
  const { iduser, password } = req.body;
  // validate request
  if (!iduser || !password) {
    return Responder(
      res,
      "ERROR",
      "UserId atau Password tidak boleh kosong.",
      null
    );
  }

  M_User.findOne({ where: { iduser: iduser } })
    .then((data) => {
      if (data) {
        Responder(res, "OK", null, data);
      } else {
        Responder(res, "ERROR", "Data user tidak ditemukan!", null, 404);
      }
    })
    .catch((err) => {
      Responder(res, "ERROR", null, null, 500);
    });
};
