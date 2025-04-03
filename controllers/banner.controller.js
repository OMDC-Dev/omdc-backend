const db = require("../db/user.db");
const { uploadImagesCloudinary } = require("../utils/cloudinary");
const { Responder } = require("../utils/responder");
const BANNER_DB = db.banner;

exports.add_banner = async (req, res) => {
  const { image } = req.body;
  try {
    let IMG_UPLOAD;
    if (image) {
      IMG_UPLOAD = await uploadImagesCloudinary(image);
    }

    if (IMG_UPLOAD.secure_url) {
      await BANNER_DB.create({
        banner: IMG_UPLOAD.secure_url,
      });
    }

    console.log("BANNER", IMG_UPLOAD);

    Responder(res, "OK", null, { success: true }, 200);
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.delete_banner = async (req, res) => {
  const { id } = req.params;
  try {
    await BANNER_DB.destroy({ where: { id: id } });

    Responder(res, "OK", null, { success: true }, 200);
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.get_banner = async (req, res) => {
  try {
    const data = await BANNER_DB.findAll();

    Responder(res, "OK", null, data, 200);
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
