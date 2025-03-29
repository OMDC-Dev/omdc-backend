const { default: axios } = require("axios");

const DRIVE_API =
  "https://script.google.com/macros/s/AKfycbxEC7cdTF_ceeM0pAsuROUgvrPF0P6LvXIfciWVRPn6Z3hZf-_8g5W0Ngd4inxGbAjq/exec";

async function uploadToDrive(base64, fileName) {
  const body = {
    base64String: base64,
    fileName: fileName,
    folderId: "1I-DmJvbYRZN3m5QMgZuErRxS6odqbLdX",
  };

  try {
    const upload = await axios.post(DRIVE_API, body);
    const data = await upload.data;
    if (data.status == "success") {
      return data.downloadUrl;
    }
    console.log(data);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  uploadToDrive,
};
