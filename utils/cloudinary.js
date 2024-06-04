const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dq4jflimm",
  api_key: "437757785831978",
  api_secret: "h0qkd9QfYMF02khAT2NODzUVCFU", // Click 'View Credentials' below to copy your API secret
});

async function uploadImagesCloudinary(base64) {
  try {
    const uploadResponse = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64}`,
      {
        folder: "omdcclient",
        transformation: [{ quality: "auto:best" }, { fetch_format: "auto" }],
      }
    );
    return uploadResponse;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  uploadImagesCloudinary,
};
