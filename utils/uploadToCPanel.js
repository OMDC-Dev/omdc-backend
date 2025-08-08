const { default: axios } = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");
const { generateRandomNumber } = require("./utils");

const CPANEL_API_URL = "https://omdc.online:2083/execute/Fileman/upload_files";
const CPANEL_AUTH = "cpanel omdcadmin:O9LAMRR08IFYQICQKGJRTWCKQAO2ICPR";
const PUBLIC_URL_BASE = "https://omdc.online/omdc_doc";

async function uploadToCPanel(base64, fileName) {
  // Pastikan folder tmp ada
  const TMP_DIR = path.join(__dirname, "tmp");
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR);
  }

  try {
    // Simpan file sementara ke __dirname/tmp
    const cleanedBase64 = base64.replace(/^data:.*;base64,/, "");
    const buffer = Buffer.from(cleanedBase64, "base64");
    const safeFileName = fileName
      .trim()
      .replace(/\s+/g, "_") // ubah spasi jadi underscore
      .replace(/[^a-zA-Z0-9._-]/g, "_"); // hanya izinkan karakter aman

    // Tambahkan random prefix supaya unik
    const finalFileName = `FILE_${generateRandomNumber(
      100000,
      999999
    )}-${safeFileName}`;
    const tempFilePath = path.join(TMP_DIR, finalFileName);
    fs.writeFileSync(tempFilePath, buffer);

    // Siapkan form data untuk upload ke cPanel
    const form = new FormData();
    form.append("dir", "public_html/omdc_doc"); // Target upload folder di cPanel
    form.append("file-1", fs.createReadStream(tempFilePath));

    const response = await axios.post(CPANEL_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: CPANEL_AUTH,
      },
    });

    // Hapus file sementara
    fs.unlinkSync(tempFilePath);

    if (response.data.status === 1) {
      const fileUrl = `${PUBLIC_URL_BASE}/${finalFileName}`;
      return fileUrl;
    } else {
      console.log("FAILED TO UPLOAD");
    }
  } catch (error) {
    console.error(
      "ERROR UPLOAD",
      error?.response?.data || error.message || error
    );
    throw error;
  }
}

module.exports = {
  uploadToCPanel,
};
