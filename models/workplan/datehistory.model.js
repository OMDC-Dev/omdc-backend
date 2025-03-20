module.exports = (sequelize, Sequelize) => {
  const WorkplanDateHistory = sequelize.define(
    "workplan_date_history",
    {
      date: {
        type: Sequelize.STRING,
      },
      wp_id: {
        type: Sequelize.INTEGER,
      },
    },
    {
      tableName: "omdc_workplan_date_history",
      underscore: true,
    }
  );

  WorkplanDateHistory.associate = (models) => {
    WorkplanDateHistory.belongsTo(models.workplan, {
      foreignKey: "wp_id",
      as: "workplan",
    });
  };

  return WorkplanDateHistory;
};
