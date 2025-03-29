module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "root1234", // mac: root1234 , win:
  DB: "user",
  dialect: "mysql", // win: mariadb, mac:mysql
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
