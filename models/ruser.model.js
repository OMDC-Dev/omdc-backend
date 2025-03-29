module.exports = (sequelize, Sequelize) => {
  const R_User = sequelize.define(
    "omdc_user_session",
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
      userToken: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      isProfileComplete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      departemen: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      nomorwa: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      fcmToken: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      kodeAkses: {
        type: Sequelize.JSON,
        allowNull: false,
      },
    },
    {
      tableName: "omdc_user_session",
      timestamps: false,
      underscore: true,
    }
  );

  R_User.removeAttribute("id");
  R_User.associate = (models) => {
    R_User.hasMany(models.workplan, {
      foreignKey: "iduser",
      as: "workplants",
    });
  };

  return R_User;
};
