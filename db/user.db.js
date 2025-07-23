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
  timezone: "+07:00",
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
db_user.ruser = require("../models/ruser.model.js")(sequelize, Sequelize);
db_user.reimbursement = require("../models/reimbursement.model.js")(
  sequelize,
  Sequelize
);
db_user.superuser = require("../models/superuser.model.js")(
  sequelize,
  Sequelize
);
db_user.pengumuman = require("../models/pengumuman.model.js")(
  sequelize,
  Sequelize
);
db_user.dept = require("../models/dept.model")(sequelize, Sequelize);
db_user.coa = require("../models/coa.model")(sequelize, Sequelize);
db_user.suplier = require("../models/suplier.model")(sequelize, Sequelize);
db_user.icon = require("../models/icon.model")(sequelize, Sequelize);
db_user.adminpb = require("../models/adminpb.model")(sequelize, Sequelize);
// v4
db_user.grup = require("../models/v4/grup.model.js")(sequelize, Sequelize);
db_user.inventory_induk = require("../models/v4/inventory_induk.model.js")(
  sequelize,
  Sequelize
);
db_user.kategory = require("../models/v4/kategory.model.js")(
  sequelize,
  Sequelize
);
db_user.kemasan = require("../models/v4/kemasan.model.js")(
  sequelize,
  Sequelize
);
db_user.satuan = require("../models/v4/satuan.model.js")(sequelize, Sequelize);
db_user.invoice = require("../models/v4/invoice.model.js")(
  sequelize,
  Sequelize
);

// workplan model
db_user.workplan = require("../models/workplan/workplan.model")(
  sequelize,
  Sequelize
);

db_user.workplan_date_history = require("../models/workplan/datehistory.model")(
  sequelize,
  Sequelize
);

db_user.workplan_comment = require("../models/workplan/comment.model")(
  sequelize,
  Sequelize
);

db_user.workplan_progress = require("../models/workplan/progress.model")(
  sequelize,
  Sequelize
);

db_user.workplan_cc_users = require("../models/workplan/usercc.model.js")(
  sequelize,
  Sequelize
);

db_user.banner = require("../models/banner.model")(sequelize, Sequelize);
db_user.scheduler_report = require("../models/schedulerReport")(
  sequelize,
  Sequelize
);

// Setup associations
Object.keys(db_user).forEach((modelName) => {
  //console.log(modelName);
  if (db_user[modelName].associate) {
    db_user[modelName].associate(db_user);
  }
});

module.exports = db_user;
