module.exports = (sequelize, Sequelize) => {
  const M_User = sequelize.define(
    "m_user",
    {
      iduser: {
        type: Sequelize.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      nm_user: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      level_user: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      tgl_trans: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      user_add: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      flag: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
    },
    {
      tableName: "m_user",
      timestamps: false,
      underscore: true,
    }
  );

  M_User.removeAttribute("id");

  return M_User;
};
