module.exports = (sequelize, Sequelize) => {
  const M_Barang = sequelize.define(
    "m_barang",
    {
      kd_brg: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true,
      },
      barcode_brg: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      nm_barang: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      grup_brg: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      kategory_brg: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      kdsp: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      nmsp: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      nm_kemasan: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_satuan: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      qty_satuan: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
      },
      hrga_satuan: {
        type: Sequelize.DOUBLE(16, 2),
        allowNull: false,
      },
      hrga_kemasan: {
        type: Sequelize.DOUBLE(16, 2),
        allowNull: false,
      },
      hppsatuan: {
        type: Sequelize.DOUBLE(16, 2),
        allowNull: false,
      },
      hppkemasan: {
        type: Sequelize.DOUBLE(16, 2),
        allowNull: false,
      },
      hrga_jualsatuan: {
        type: Sequelize.DOUBLE(16, 2),
        allowNull: false,
      },
      hrga_jualkemasan: {
        type: Sequelize.DOUBLE(16, 2),
        allowNull: false,
      },
      kd_comp: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_comp: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      sts_brg: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      nm_create: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      tgl_create: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      flag_1: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },
      flag_2: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },
      flag_3: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },
      flag_4: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      val_1: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      val_2: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      val_3: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },
      val_4: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
    },
    {
      tableName: "m_barang",
      timestamps: false,
      underscore: true,
    }
  );

  //M_Barang.removeAttribute("id");

  return M_Barang;
};
