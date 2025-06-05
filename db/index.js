// const dbConfig = require("../config/db.config.js");

// const Sequelize = require("sequelize");
// const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
//   host: dbConfig.HOST,
//   dialect: dbConfig.dialect,
//   operatorsAliases: false,

//   pool: {
//     max: dbConfig.pool.max,
//     min: dbConfig.pool.min,
//     acquire: dbConfig.pool.acquire,
//     idle: dbConfig.pool.idle,
//   },
// });

// const db = {};

// db.Sequelize = Sequelize;
// db.sequelize = sequelize;

// // table
// db.devs = require("../models/dev.model.js")(sequelize, Sequelize);
// db.ruser = require("../models/ruser.model.js")(sequelize, Sequelize);
// db.reimbursement = require("../models/reimbursement.model.js")(
//   sequelize,
//   Sequelize
// );
// db.superuser = require("../models/superuser.model.js")(sequelize, Sequelize);
// db.pengumuman = require("../models/pengumuman.model.js")(sequelize, Sequelize);

// module.exports = db;
