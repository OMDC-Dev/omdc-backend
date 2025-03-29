module.exports = (sequelize, Sequelize) => {
  const WorkplanCC = sequelize.define(
    "workplan_cc_users",
    {
      workplan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "omdc_workplan",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.STRING(10),
        allowNull: false,
        references: {
          model: "omdc_user_session",
          key: "iduser",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "omdc_workplan_cc_users",
      underscore: true,
    }
  );

  return WorkplanCC;
};
