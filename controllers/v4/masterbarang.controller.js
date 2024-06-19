const db = require("../../db/user.db");
const { decodeToken, getToken } = require("../../utils/jwt");
const { Responder } = require("../../utils/responder");
const moment = require("moment");
require("moment/locale/id");
moment.locale("id");

// DB
const M_BARANG = db.barang;
const M_SUPLIER = db.suplier;
const M_INVENTORY_INDUK = db.inventory_induk;
const M_CABANG_INDUK = db.cabang;

exports.cek_barkode = async (req, res) => {
  const { barcode } = req.params;
  try {
    const find = await M_BARANG.findOne({
      where: {
        barcode_brg: barcode,
      },
    });

    if (find) {
      Responder(res, "ERROR", "Barcode sudah ada.", null, 400);
      return;
    } else {
      Responder(res, "OK", null, "OK", 200);
      return;
    }
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.add_barang = async (req, res) => {
  const { authorization } = req.headers;

  const {
    kd_brg,
    barcode_brg,
    nama_brg,
    grup_brg,
    kategory_brg,
    suplier,
    kemasan,
    satuan,
    qty_isi,
    harga_satuan,
    hpp_satuan,
    hargajual_satuan,
    status,
  } = req.body;
  try {
    // get user request
    const getUser = decodeToken(getToken(authorization));

    // Get supplier by kdsp
    let suplierData;

    if (suplier) {
      const getSupl = await M_SUPLIER.findOne({
        where: {
          kdsp: suplier,
        },
      });

      const getSuplData = await getSupl["dataValues"];

      suplierData = getSuplData;
    }

    // current date
    const currentDate = moment().format("YYYY-MM-DD");

    // save to m barang
    await M_BARANG.create({
      kd_brg: kd_brg,
      barcode_brg: barcode_brg,
      nm_barang: nama_brg,
      grup_brg: grup_brg,
      kategory_brg: kategory_brg,
      kdsp: suplierData?.kdsp || "",
      nmsp: suplierData?.nmsp || "",
      nm_kemasan: kemasan,
      nm_satuan: satuan,
      qty_satuan: qty_isi,
      hrga_satuan: harga_satuan,
      hrga_kemasan: Number(qty_isi) * Number(harga_satuan),
      hppsatuan: hpp_satuan,
      hppkemasan: Number(qty_isi) * Number(hpp_satuan),
      hrga_jualsatuan: hargajual_satuan,
      hrga_jualkemasan: Number(qty_isi) * Number(hargajual_satuan),
      kd_comp: "OSG",
      nm_comp: "PT.OKTRI SYARIEF GRUP",
      sts_brg: status,
      nm_create: "",
      tgl_create: currentDate,
      flag_1: getUser.nm_user,
      flag_2: currentDate,
      flag_3: "",
      flag_4: "",
      val_1: "",
      val_2: "",
      val_3: "",
      val_4: "",
    });

    // Add to inventory induk
    const cabang_induk = await M_CABANG_INDUK.findAll();

    cabang_induk.map(async (item) => {
      await M_INVENTORY_INDUK.create({
        id_inv: `${item.kd_induk}${kd_brg}`,
        kd_brg: kd_brg,
        nm_barang: nama_brg,
        kd_induk: item.kd_induk,
        nm_induk: item.nm_induk,
        kd_comp: item.kd_comp,
        nm_comp: item.nm_comp,
        onhand: 0,
        nm_satuan: satuan,
        pkm: 0,
        pkm_satuan: satuan,
        mpkm: 0,
        mpkm_satuan: satuan,
        tgl_update: currentDate,
        flag_1: currentDate,
        flag_2: currentDate,
        flag_3: "",
        flag_4: "",
      });
    });

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.update_barang = async (req, res) => {
  const { authorization } = req.headers;
  const { kode_barang } = req.params;

  const {
    barcode_brg,
    nama_brg,
    grup_brg,
    kategory_brg,
    suplier,
    kemasan,
    satuan,
    qty_isi,
    harga_satuan,
    hpp_satuan,
    hargajual_satuan,
    status,
  } = req.body;
  try {
    // get user request
    const getUser = decodeToken(getToken(authorization));

    // Get supplier by kdsp
    let suplierData;

    if (suplier) {
      const getSupl = await M_SUPLIER.findOne({
        where: {
          kdsp: suplier,
        },
      });

      const getSuplData = await getSupl["dataValues"];

      suplierData = getSuplData;
    }

    // current date
    const currentDate = moment().format("YYYY-MM-DD");

    // update to m barang
    await M_BARANG.update(
      {
        barcode_brg: barcode_brg,
        nm_barang: nama_brg,
        grup_brg: grup_brg,
        kategory_brg: kategory_brg,
        kdsp: suplierData?.kdsp || "",
        nmsp: suplierData?.nmsp || "",
        nm_kemasan: kemasan,
        nm_satuan: satuan,
        qty_satuan: qty_isi,
        hrga_satuan: harga_satuan,
        hrga_kemasan: Number(qty_isi) * Number(harga_satuan),
        hppsatuan: hpp_satuan,
        hppkemasan: Number(qty_isi) * Number(hpp_satuan),
        hrga_jualsatuan: hargajual_satuan,
        hrga_jualkemasan: Number(qty_isi) * Number(hargajual_satuan),
        kd_comp: "OSG",
        nm_comp: "PT.OKTRI SYARIEF GRUP",
        sts_brg: status,
        nm_create: "",
        tgl_create: currentDate,
        flag_1: getUser.nm_user,
        flag_2: currentDate,
        flag_3: "",
        flag_4: "",
        val_1: "",
        val_2: "",
        val_3: "",
        val_4: "",
      },
      {
        where: {
          kd_brg: kode_barang,
        },
      }
    );

    // update to inventory induk
    await M_INVENTORY_INDUK.update(
      {
        nm_barang: nama_brg,
        onhand: 0,
        nm_satuan: satuan,
        pkm: 0,
        pkm_satuan: satuan,
        mpkm: 0,
        mpkm_satuan: satuan,
        tgl_update: currentDate,
        flag_1: currentDate,
        flag_2: currentDate,
        flag_3: "",
        flag_4: "",
      },
      {
        where: {
          kd_brg: kode_barang,
        },
      }
    );

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
