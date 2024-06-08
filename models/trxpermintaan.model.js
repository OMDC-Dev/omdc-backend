module.exports = (sequelize, Sequelize) => {
  const TrxPermintaanBarang = sequelize.define(
    "trx_permintaanbarang",
    {
      id_trans: {
        type: Sequelize.STRING(100),
        allowNull: false,
        primaryKey: true,
      },
      id_pb: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      id_pr: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      kd_induk: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_induk: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      kd_comp: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_comp: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      kd_cabang: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_cabang: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      kdsp: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nmsp: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kd_brg: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      barcode_brg: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      nm_barang: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      grup_brg: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      kategory_brg: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      nm_kemasan: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      nm_satuan: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      qty_satuan: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
      },
      jml_satuan: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
      },
      nm_satuan1: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      jml_kemasan: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
      },
      nm_kemasan1: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      qty_stock: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
      },
      nm_kemasanstock: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      keterangan: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      tgl_trans: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      jam: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      iduser: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_user: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      status_approve: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      id_approve: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      nm_approve: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      tgl_approve: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      status_pb: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      flag: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      flag_1: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      attachment: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approval_adminid: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approval_admin_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approval_admin_date: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approval_admin_status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "trx_permintaanbarang",
      timestamps: false,
      underscore: true,
    }
  );

  TrxPermintaanBarang.removeAttribute("id");

  return TrxPermintaanBarang;
};
