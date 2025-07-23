module.exports = (sequelize, Sequelize) => {
  const Report = sequelize.define(
    "report",
    {
      is_sent: {
        type: Sequelize.STRING,
      },
    },
    {
      tableName: "omdc_scheduler_report",
      underscore: true,
    }
  );

  return Report;
};
