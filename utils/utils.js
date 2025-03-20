const moment = require("moment");
const { decodeToken, getToken } = require("./jwt");
require("moment/locale/id");
moment.locale("id");

function generateRandomNumber(min, max) {
  // Menghasilkan nomor acak di antara min (inklusif) dan max (inklusif)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFormattedDate(date = new Date(), sep = "") {
  // Ambil tahun, bulan, dan tanggal dari objek Date
  const year = date.getFullYear();
  // Tambahkan 1 karena bulan dimulai dari 0 (0 = Januari, 1 = Februari, dst.)
  const month = String(date.getMonth() + 1).padStart(2, "0"); // PadStart digunakan untuk menambahkan 0 di depan jika hanya 1 digit
  const day = String(date.getDate()).padStart(2, "0");

  // Gabungkan tahun, bulan, dan tanggal dengan tanda hubung
  return `${year}${sep}${month}${sep}${day}`;
}

function ubahDataById(data, id, idKey, key, dataBaru) {
  for (var i = 0; i < data.length; i++) {
    if (data[i][idKey] === id) {
      data[i][key] = dataBaru;
      break;
    }
  }
}

function getDateValidFormat(inputDate) {
  // Cek apakah inputDate valid dan dalam format "YYYY-MM-DD"
  if (moment(inputDate, "YYYY-MM-DD", true).isValid()) {
    return inputDate;
  }
  // Cek apakah inputDate valid dan dalam format "DD-MM-YYYY"
  else if (moment(inputDate, "DD-MM-YYYY", true).isValid()) {
    // Ubah format ke "YYYY-MM-DD"
    return moment(inputDate, "DD-MM-YYYY").format("YYYY-MM-DD");
  } else {
    throw new Error("Invalid date format");
  }
}

function addAdminApprovalDate(data, iduser, tgl_approve) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].iduser === iduser) {
      data[i].tgl_approve = tgl_approve;
      return; // Optional: Stop looping once the iduser is found and updated
    }
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function getUserDatabyToken(auth) {
  if (!auth) return null;
  return decodeToken(getToken(auth));
}

function checkUserAuth(token) {
  if (!token) {
    return { error: true, message: "User tidak memiliki akses." };
  }

  if (!token.iduser) {
    return { error: true, message: "User token tidak valid." };
  }

  return { error: false, message: "" };
}

module.exports = {
  generateRandomNumber,
  getFormattedDate,
  ubahDataById,
  getDateValidFormat,
  addAdminApprovalDate,
  isValidUrl,
  getUserDatabyToken,
  checkUserAuth,
};
