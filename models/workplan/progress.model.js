module.exports = (sequelize, Sequelize) => {
  const WorkplanProgress = sequelize.define(
    "workplan_progress",
    {
      progress: {
        type: Sequelize.STRING,
      },
      wp_id: {
        type: Sequelize.INTEGER,
      },
    },
    {
      tableName: "omdc_workplan_progress",
      underscore: true,
    }
  );

  return WorkplanProgress;
};
