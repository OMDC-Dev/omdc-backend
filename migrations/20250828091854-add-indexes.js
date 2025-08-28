"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * INDEXING REIMBURSEMENT
     */
    await queryInterface.addIndex("omdc_reimbursements", {
      fields: [{ name: "no_doc", length: 100 }],
      name: "idx_reimbursement_no_doc",
    });
    await queryInterface.addIndex("omdc_reimbursements", {
      fields: [{ name: "kode_cabang", length: 50 }],
      name: "idx_reimbursement_kode_cabang",
    });
    await queryInterface.addIndex("omdc_reimbursements", {
      fields: [{ name: "requester_id", length: 50 }],
      name: "idx_reimbursement_requester_id",
    });
    await queryInterface.addIndex("omdc_reimbursements", ["status"], {
      name: "idx_reimbursement_status",
    });
    await queryInterface.addIndex("omdc_reimbursements", ["status_finance"], {
      name: "idx_reimbursement_status_finance",
    });
    await queryInterface.addIndex("omdc_reimbursements", {
      fields: [{ name: "tanggal_reimbursement", length: 20 }],
      name: "idx_reimbursement_tanggal",
    });
    await queryInterface.addIndex("omdc_reimbursements", {
      fields: [{ name: "kdsp", length: 20 }],
      name: "idx_reimbursement_kdsp",
    });

    /**
     * INDEXING R_USER (omdc_user_session)
     */
    await queryInterface.addIndex("omdc_user_session", ["status"], {
      name: "idx_user_session_status",
    });
    await queryInterface.addIndex("omdc_user_session", ["isAdmin"], {
      name: "idx_user_session_isAdmin",
    });
    await queryInterface.addIndex("omdc_user_session", {
      fields: [{ name: "type", length: 50 }],
      name: "idx_user_session_type",
    });

    /**
     * INDEXING SUPER_USER (omdc_super_users)
     */
    await queryInterface.addIndex("omdc_super_users", {
      fields: [{ name: "type", length: 50 }],
      name: "idx_superuser_type",
    });
    await queryInterface.addIndex("omdc_super_users", {
      fields: [{ name: "nm_user", length: 100 }],
      name: "idx_superuser_nm_user",
    });
    await queryInterface.addIndex("omdc_super_users", {
      fields: [{ name: "departemen", length: 50 }],
      name: "idx_superuser_departemen",
    });
    await queryInterface.addIndex("omdc_super_users", {
      fields: [{ name: "level_user", length: 50 }],
      name: "idx_superuser_level_user",
    });

    /**
     * INDEXING BARANG (m_barang)
     */
    await queryInterface.addIndex("m_barang", ["sts_brg"], {
      name: "idx_barang_status",
    });
    await queryInterface.addIndex("m_barang", {
      fields: [{ name: "nm_barang", length: 100 }],
      name: "idx_barang_nm_barang",
    });
    await queryInterface.addIndex("m_barang", {
      fields: [{ name: "barcode_brg", length: 100 }],
      name: "idx_barang_barcode",
    });
    await queryInterface.addIndex("m_barang", {
      fields: [{ name: "kdsp", length: 50 }],
      name: "idx_barang_kdsp",
    });
    await queryInterface.addIndex("m_barang", {
      fields: [{ name: "kd_comp", length: 50 }],
      name: "idx_barang_kd_comp",
    });
  },

  async down(queryInterface, Sequelize) {
    // reimbursement
    await queryInterface.removeIndex(
      "omdc_reimbursements",
      "idx_reimbursement_no_doc"
    );
    await queryInterface.removeIndex(
      "omdc_reimbursements",
      "idx_reimbursement_kode_cabang"
    );
    await queryInterface.removeIndex(
      "omdc_reimbursements",
      "idx_reimbursement_requester_id"
    );
    await queryInterface.removeIndex(
      "omdc_reimbursements",
      "idx_reimbursement_status"
    );
    await queryInterface.removeIndex(
      "omdc_reimbursements",
      "idx_reimbursement_status_finance"
    );
    await queryInterface.removeIndex(
      "omdc_reimbursements",
      "idx_reimbursement_tanggal"
    );
    await queryInterface.removeIndex(
      "omdc_reimbursements",
      "idx_reimbursement_kdsp"
    );

    // ruser
    await queryInterface.removeIndex(
      "omdc_user_session",
      "idx_user_session_status"
    );
    await queryInterface.removeIndex(
      "omdc_user_session",
      "idx_user_session_isAdmin"
    );
    await queryInterface.removeIndex(
      "omdc_user_session",
      "idx_user_session_type"
    );

    // superuser
    await queryInterface.removeIndex("omdc_super_users", "idx_superuser_type");
    await queryInterface.removeIndex(
      "omdc_super_users",
      "idx_superuser_nm_user"
    );
    await queryInterface.removeIndex(
      "omdc_super_users",
      "idx_superuser_departemen"
    );
    await queryInterface.removeIndex(
      "omdc_super_users",
      "idx_superuser_level_user"
    );

    // barang
    await queryInterface.removeIndex("m_barang", "idx_barang_status");
    await queryInterface.removeIndex("m_barang", "idx_barang_nm_barang");
    await queryInterface.removeIndex("m_barang", "idx_barang_barcode");
    await queryInterface.removeIndex("m_barang", "idx_barang_kdsp");
    await queryInterface.removeIndex("m_barang", "idx_barang_kd_comp");
  },
};
