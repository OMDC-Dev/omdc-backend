const md5 = require("md5");

const encPassword = (pass) => {
  return md5(pass);
};

module.exports = {
  encPassword,
};
