module.exports = (sequelize, Sequelize) => {
  const PermintaanBarang = sequelize.define(
    "m_permintaanbarang",
    {
      id_pb: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      id_pr: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      kd_induk: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nm_induk: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      kd_comp: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nm_comp: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      kd_cabang: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nm_cabang: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alamat: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      keterangan: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tgl_trans: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      jam_trans: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      iduser: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nm_user: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status_approve: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      id_approve: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nm_approve: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tgl_approve: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status_pb: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      flag: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      flag_1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      flag_2: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      flag_3: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      approval_adminid: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approval_admin_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approval_admin_date: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approval_admin_status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "m_permintaanbarang",
      timestamps: false,
      underscore: true,
    }
  );

  PermintaanBarang.removeAttribute("id");

  return PermintaanBarang;
};
