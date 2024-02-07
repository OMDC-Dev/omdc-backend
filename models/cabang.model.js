module.exports = (sequelize, Sequelize) => {
  const M_IndukCabang = sequelize.define(
    "m_induk_cabang",
    {
      kd_induk: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true,
      },
      nm_induk: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      alamat: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      kelurahan: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kecamatan: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kota: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      provinsi: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kd_pos: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      no_telp: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      tgl_berdiri: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      no_npwp: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      owner: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      kd_comp: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_comp: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      grup_comp: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      tgl_create: {
        type: Sequelize.DATEONLY,
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
      logo: {
        type: Sequelize.BLOB,
        allowNull: false,
      },
    },
    {
      tableName: "m_induk_cabang",
      timestamps: false,
      underscore: true,
    }
  );

  M_IndukCabang.removeAttribute("id");

  return M_IndukCabang;
};
