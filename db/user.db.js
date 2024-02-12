const dbConfig = require("../config/user.config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db_user = {};

db_user.Sequelize = Sequelize;
db_user.sequelize = sequelize;

// table
db_user.muser = require("../models/muser.model")(sequelize, Sequelize);
db_user.cabang = require("../models/cabang.model")(sequelize, Sequelize);
db_user.anak_cabang = require("../models/anakcabang.model")(
  sequelize,
  Sequelize
);
db_user.barang = require("../models/barang.model")(sequelize, Sequelize);
db_user.akses = require("../models/aksesuser.model")(sequelize, Sequelize);
db_user.trx_permintaan_barang = require("../models/trxpermintaan.model")(
  sequelize,
  Sequelize
);
db_user.permintaan_barang = require("../models/permintaanbarang.model")(
  sequelize,
  Sequelize
);

module.exports = db_user;
