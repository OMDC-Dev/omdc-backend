const db = require("../../db/user.db");
const { Responder } = require("../../utils/responder");
const M_BARANG = db.barang;

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
