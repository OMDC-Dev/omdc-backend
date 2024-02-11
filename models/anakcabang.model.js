module.exports = (sequelize, Sequelize) => {
  const M_AnakCabang = sequelize.define(
    "m_cabang",
    {
      kd_cabang: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true,
      },
      nm_cabang: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      alamat_cabang: {
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
      kd_induk: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nm_induk: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      grup_comp: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      tgl_create: {
        type: Sequelize.DATE,
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
    },
    {
      tableName: "m_cabang",
      timestamps: false,
      underscore: true,
    }
  );

  M_AnakCabang.removeAttribute("id");

  return M_AnakCabang;
};
