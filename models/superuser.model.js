module.exports = (sequelize, Sequelize) => {
  const Super_User = sequelize.define(
    "super_users",
    {
      iduser: {
        type: Sequelize.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      nm_user: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      level_user: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      departemen: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "super_users",
      timestamps: false,
      underscore: true,
    }
  );

  Super_User.removeAttribute("id");

  return Super_User;
};
