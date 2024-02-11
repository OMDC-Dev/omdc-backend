const { Op } = require("sequelize");
const user_db = require("../db/user.db");
const { Responder } = require("../utils/responder");

const AnakCabang = user_db.anak_cabang;
const Barang = user_db.barang;
const IndukCabang = user_db.cabang;

exports.getAllAnakCabang = async (req, res) => {
  const { kd_induk } = req.query;
  try {
    const whereClause = {};

    if (kd_induk) {
      whereClause.kd_induk = kd_induk;
    }

    const data = await AnakCabang.findAll({
      where: whereClause,
    });

    Responder(res, "OK", null, data, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.getCabangDetail = async (req, res) => {
  const { kode } = req.query;

  try {
    const getCabang = await AnakCabang.findOne({ where: { kd_cabang: kode } });
    const cabangData = await getCabang["dataValues"];

    Responder(res, "OK", null, cabangData, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.getBarang = async (req, res) => {
  const { cari, page = 1, limit = 25 } = req.query;

  try {
    const whereClause = {};

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    if (cari) {
      const searchSplit = cari.split(" ");
      whereClause[Op.and] = searchSplit.map((item) => ({
        nm_barang: {
          [Op.like]: `%${item}%`,
        },
      }));
    }

    const barangCount = await Barang.count();

    const data = await Barang.findAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
    });

    Responder(
      res,
      "OK",
      null,
      { data: data, endPage: Math.round(barangCount / limit) },
      200
    );
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
