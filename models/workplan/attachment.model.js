module.exports = (sequelize, Sequelize) => {
  const WorkplanAttachment = sequelize.define(
    "workplan_attachment",
    {
      workplan_id: {
        type: Sequelize.INTEGER,
      },
      image_url: {
        type: Sequelize.STRING,
      },
      caption: {
        type: Sequelize.STRING,
      },
    },
    {
      tableName: "omdc_workplan_attachment",
      underscore: true,
    }
  );

  return WorkplanAttachment;
};
