module.exports = (sequelize, Sequelize) => {
  const M_Satuan = sequelize.define(
    "satuan",
    {
      nm_satuan: {
        type: Sequelize.STRING(60),
        allowNull: false,
        primaryKey: true,
      },
      tgl_create: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      flag_1: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
    },
    {
      tableName: "m_satuan",
      timestamps: false,
    }
  );

  return M_Satuan;
};
