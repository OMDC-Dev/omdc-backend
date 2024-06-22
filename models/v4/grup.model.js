module.exports = (sequelize, Sequelize) => {
  const M_Grup = sequelize.define(
    "grup",
    {
      grup_brg: {
        type: Sequelize.STRING(30),
        allowNull: false,
        primaryKey: true,
      },
      tgl_create: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      flag: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
    },
    {
      tableName: "m_grup",
      timestamps: false,
    }
  );

  return M_Grup;
};
