module.exports = (sequelize, Sequelize) => {
  const M_Inventory_Induk = sequelize.define(
    "inventory_induk",
    {
      id_inv: {
        type: Sequelize.STRING(50),
        allowNull: false,
        primaryKey: true,
      },
      kd_brg: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_barang: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kd_induk: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_induk: {
        type: Sequelize.STRING(100),
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
      onhand: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
      },
      nm_satuan: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      pkm: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
      },
      pkm_satuan: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      mpkm: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
      },
      mpkm_satuan: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      tgl_update: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      flag_1: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      flag_2: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      flag_3: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      flag_4: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "m_inventory_induk",
      timestamps: false,
    }
  );

  return M_Inventory_Induk;
};
