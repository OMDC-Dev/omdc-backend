const db = require("../db/user.db");
const { Responder } = require("../utils/responder");
const ICON = db.icon;

// Create and Save
exports.updateIcon = async (req, res) => {
  const { icon, iconMobile } = req.body;
  try {
    const getIcon = await ICON.findOne({
      where: {
        id: 1,
      },
    });

    if (!getIcon) {
      await ICON.create({
        icon: icon,
        iconMobile: iconMobile,
      });

      Responder(res, "OK", null, "Berhasil mengubah icon", 200);
      return;
    }

    await ICON.update(
      {
        icon: icon,
        iconMobile: iconMobile,
      },
      {
        where: {
          id: 1,
        },
      }
    );

    Responder(res, "OK", null, "Berhasil mengubah icon", 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, "Gagal mengubah icon", 400);
    return;
  }
};

// Create and Save
exports.getIcon = async (req, res) => {
  try {
    const icon = await ICON.findOne({
      where: {
        id: 1,
      },
    });

    const getIcon = await icon["dataValues"];

    Responder(res, "OK", null, getIcon, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, "Gagal mengambil icon", 400);
    return;
  }
};
