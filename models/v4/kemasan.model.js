module.exports = (sequelize, Sequelize) => {
  const M_Kemasan = sequelize.define(
    "kemasan",
    {
      nm_kemasan: {
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
      tableName: "m_kemasan",
      timestamps: false,
    }
  );

  return M_Kemasan;
};
