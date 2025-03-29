module.exports = (sequelize, Sequelize) => {
  const Banner = sequelize.define(
    "banner",
    {
      banner: {
        type: Sequelize.STRING,
      },
    },
    {
      tableName: "omdc_banner",
      timestamps: false,
      underscore: true,
    }
  );

  return Banner;
};
