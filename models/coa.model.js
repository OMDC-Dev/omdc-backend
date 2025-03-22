module.exports = (sequelize, Sequelize) => {
  const COA = sequelize.define(
    "coa",
    {
      id_coa: {
        type: Sequelize.STRING(12),
        primaryKey: true,
      },
      accountname: {
        type: Sequelize.TEXT,
      },
      description: {
        type: Sequelize.TEXT,
      },
      Status: {
        type: Sequelize.STRING(20),
      },
    },
    {
      tableName: "omdc_coa",
      timestamps: false,
      underscore: true,
    }
  );

  COA.removeAttribute("id");

  return COA;
};
