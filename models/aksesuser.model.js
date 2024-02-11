module.exports = (sequelize, Sequelize) => {
  const AksesUser = sequelize.define(
    "m_ver_user_log",
    {
      idver: {
        type: Sequelize.STRING(60),
        allowNull: false,
        primaryKey: true,
      },
      kd_ver: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      deskripsi: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      iduser: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      flag: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
    },
    {
      tableName: "m_ver_user_log",
      timestamps: false,
      underscore: true,
    }
  );

  AksesUser.removeAttribute("id");

  return AksesUser;
};
