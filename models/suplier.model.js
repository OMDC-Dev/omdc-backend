module.exports = (sequelize, Sequelize) => {
  const M_Suplier = sequelize.define(
    "m_suplier",
    {
      kdsp: {
        type: Sequelize.STRING(20),
        primaryKey: true,
        allowNull: true,
      },
      nmsp: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      alamat: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      kota: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      provinsi: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      kdpos: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      no_tlp: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      no_fax: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      pic: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      no_hp: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      owner: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      nm_bank: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      cabang_bank: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      no_rekbank: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      nm_pemilik_rek: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      tgl_create: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      nm_create: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      flag_1: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      flag_2: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      val_1: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
    },
    {
      tableName: "m_suplier",
      timestamps: false,
      underscore: true,
    }
  );

  M_Suplier.removeAttribute("id");
  M_Suplier.associate = (models) => {
    M_Suplier.hasMany(models.reimbursement, {
      foreignKey: "kdsp",
      as: "reimbursements",
    });
  };

  return M_Suplier;
};
