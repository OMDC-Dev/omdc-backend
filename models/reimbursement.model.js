module.exports = (sequelize, Sequelize) => {
  const Reimbursement = sequelize.define("reimbursement", {
    no_doc: {
      type: Sequelize.TEXT,
    },
    jenis_reimbursement: {
      type: Sequelize.TEXT,
    },
    tanggal_reimbursement: {
      type: Sequelize.TEXT,
    },
    kode_cabang: {
      type: Sequelize.STRING,
    },
    requester_id: {
      type: Sequelize.TEXT,
    },
    requester_dept: {
      type: Sequelize.TEXT,
    },
    name: {
      type: Sequelize.TEXT,
    },
    coa: {
      type: Sequelize.TEXT,
    },
    item: {
      type: Sequelize.TEXT,
    },
    description: {
      type: Sequelize.TEXT,
    },
    nomor: {
      type: Sequelize.TEXT,
    },
    nominal: {
      type: Sequelize.TEXT,
    },
    status: {
      type: Sequelize.STRING,
    },
    attachment: {
      type: Sequelize.TEXT("long"),
    },
    bank_detail: {
      type: Sequelize.TEXT,
    },
    note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    accepted_date: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    accepted_by: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });

  return Reimbursement;
};
