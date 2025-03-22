module.exports = (sequelize, Sequelize) => {
  const Icon = sequelize.define(
    "omdc_icon",
    {
      icon: {
        type: Sequelize.TEXT("long"),
      },
      iconMobile: {
        type: Sequelize.TEXT("long"),
      },
    },
    {
      tableName: "omdc_icon",
      timestamps: false,
    }
  );

  return Icon;
};
