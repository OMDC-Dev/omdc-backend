const db = require("../../db/user.db");
const { Responder } = require("../../utils/responder");
const INVOICE = db.invoice;

exports.cekInvoice = async (req, res) => {
  const { invoice } = req.params;

  try {
    const getInv = await INVOICE.findOne({
      where: {
        invoice: invoice,
      },
    });

    if (getInv) {
      Responder(res, "ERROR", "No. Invoice telah digunakan.", null, 400);
      return;
    }

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
