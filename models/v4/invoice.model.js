module.exports = (sequelize, Sequelize) => {
  const RopInvoice = sequelize.define(
    "rop_invoice",
    {
      invoice: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      rop_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      nama: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      nominal: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      tableName: "omdc_rop_invoice",
      timestamps: false,
    }
  );

  return RopInvoice;
};
