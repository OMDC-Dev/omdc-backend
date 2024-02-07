const jwt = require("jsonwebtoken");
const { jwtDecode } = require("jwt-decode");
const { Responder } = require("./responder");

function generateAccessToken(user) {
  return jwt.sign(user, "PASSWORD_SECRET_HASH", { expiresIn: "7d" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null)
    return Responder(res, "ERROR", "User Unauthenticated!", null, 401);

  jwt.verify(token, "PASSWORD_SECRET_HASH", (err, user) => {
    console.log(err);

    if (err) return Responder(res, "ERROR", "User Token Invalid!", null, 403);

    req.user = user;

    next();
  });
}

function decodeToken(jwt) {
  return jwtDecode(jwt);
}

function getToken(token = "") {
  const tk = token.split(" ")[1];
  return tk;
}

module.exports = {
  generateAccessToken,
  authenticateToken,
  decodeToken,
  getToken,
};
