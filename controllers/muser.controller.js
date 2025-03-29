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

exports.update_userstatus_by_nik = async (req, res) => {
  const { nik } = req.params;
  const { status } = req.query;
  try {
    if (!nik || !status) {
      return Responder(
        res,
        "ERROR",
        "NIK atau Status tidak boleh kosong.",
        null
      );
    }

    if (
      status.toLowerCase() !== "aktif" &&
      status.toLowerCase() !== "tidakaktif"
    ) {
      return Responder(
        res,
        "ERROR",
        "Status harus memiliki value salah satu dari 'Aktif' atau 'TidakAktif'",
        null
      );
    }

    const getUser = await M_User.findOne({
      where: {
        flag: nik,
      },
    });

    if (!getUser) {
      return Responder(
        res,
        "ERROR",
        `User dengan NIK ${nik} tidak ditemukan.`,
        null
      );
    }

    const statusFinal =
      status.toLowerCase() == "aktif" ? "Aktif" : "Tidak Aktif";

    await M_User.update({ status: statusFinal }, { where: { flag: nik } });
    return Responder(res, "OK", null, { success: true }, 200);
  } catch (error) {
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};
