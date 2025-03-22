module.exports = (sequelize, Sequelize) => {
  const AdminPB = sequelize.define(
    "admin_pb",
    {
      iduser: {
        type: Sequelize.STRING,
      },
      nm_user: {
        type: Sequelize.STRING,
      },
    },
    {
      tableName: "omdc_admin_pb",
      timestamps: false,
    }
  );

  return AdminPB;
};
