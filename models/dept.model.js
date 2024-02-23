module.exports = (sequelize, Sequelize) => {
  const Dept = sequelize.define("departemen", {
    label: {
      type: Sequelize.STRING,
    },
  });

  return Dept;
};
