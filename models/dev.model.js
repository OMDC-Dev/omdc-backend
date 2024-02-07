module.exports = (sequelize, Sequelize) => {
  const Dev = sequelize.define("dev", {
    title: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    published: {
      type: Sequelize.BOOLEAN,
    },
  });

  return Dev;
};
