module.exports = (sequelize, Sequelize) => {
  const M_Kategory = sequelize.define(
    "kategory",
    {
      kategory_brg: {
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
      tableName: "m_kategory",
      timestamps: false,
    }
  );

  return M_Kategory;
};
