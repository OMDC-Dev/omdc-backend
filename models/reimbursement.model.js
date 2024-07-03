module.exports = (sequelize, Sequelize) => {
  const Reimbursement = sequelize.define("omdc_reimbursement", {
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
      type: Sequelize.STRING,
    },
    requester_name: {
      type: Sequelize.STRING,
    },
    requester: {
      type: Sequelize.JSON,
    },
    name: {
      type: Sequelize.TEXT,
    },
    coa: {
      type: Sequelize.TEXT,
    },
    item: {
      type: Sequelize.JSON,
    },
    description: {
      type: Sequelize.TEXT,
    },
    nominal: {
      type: Sequelize.TEXT,
    },
    status: {
      type: Sequelize.STRING,
    },
    status_finance: {
      type: Sequelize.STRING,
    },
    status_finance_child: {
      type: Sequelize.STRING,
    },
    finance_by: {
      type: Sequelize.JSON,
    },
    attachment: {
      type: Sequelize.TEXT("long"),
    },
    bank_detail: {
      type: Sequelize.JSON,
    },
    payment_type: {
      type: Sequelize.STRING,
    },
    file_info: {
      type: Sequelize.JSON,
    },
    note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    finance_note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    accepted_date: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    accepted_by: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    realisasi: {
      type: Sequelize.STRING,
    },
    pengajuan_ca: {
      type: Sequelize.STRING,
    },
    childId: {
      type: Sequelize.STRING,
    },
    parentId: {
      type: Sequelize.STRING,
    },
    parentDoc: {
      type: Sequelize.STRING,
    },
    childDoc: {
      type: Sequelize.STRING,
    },
    tipePembayaran: {
      type: Sequelize.STRING,
    },
    finance_bank: {
      type: Sequelize.STRING,
    },
    reviewStatus: {
      type: Sequelize.STRING,
    },
    review_note: {
      type: Sequelize.STRING,
    },
    makerStatus: {
      type: Sequelize.STRING,
    },
    maker_note: {
      type: Sequelize.STRING,
    },
    needExtraAcceptance: {
      type: Sequelize.BOOLEAN,
    },
    extraAcceptance: {
      type: Sequelize.JSON,
    },
    extraAcceptanceStatus: {
      type: Sequelize.STRING,
    },
    maker_approve: {
      type: Sequelize.STRING(255),
    },
    reviewer_approve: {
      type: Sequelize.STRING(255),
    },
    extra_admin_approve: {
      type: Sequelize.STRING(255),
    },
    nm_maker_approve: {
      type: Sequelize.STRING(255),
    },
    nm_reviewer_approve: {
      type: Sequelize.STRING(255),
    },
  });

  return Reimbursement;
};
