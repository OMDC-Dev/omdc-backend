"use strict";

async function addIndexSafe(queryInterface, table, indexName, sql) {
  const [results] = await queryInterface.sequelize.query(
    `SHOW INDEX FROM \`${table}\` WHERE Key_name = '${indexName}'`
  );
  if (results.length === 0) {
    await queryInterface.sequelize.query(sql);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * REIMBURSEMENT
     */
    await addIndexSafe(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_no_doc",
      "CREATE INDEX idx_reimbursement_no_doc ON omdc_reimbursements (no_doc(100))"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_kode_cabang",
      "CREATE INDEX idx_reimbursement_kode_cabang ON omdc_reimbursements (kode_cabang(50))"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_requester_id",
      "CREATE INDEX idx_reimbursement_requester_id ON omdc_reimbursements (requester_id(50))"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_status",
      "CREATE INDEX idx_reimbursement_status ON omdc_reimbursements (status)"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_status_finance",
      "CREATE INDEX idx_reimbursement_status_finance ON omdc_reimbursements (status_finance)"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_tanggal",
      "CREATE INDEX idx_reimbursement_tanggal ON omdc_reimbursements (tanggal_reimbursement(20))"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_kdsp",
      "CREATE INDEX idx_reimbursement_kdsp ON omdc_reimbursements (kdsp(20))"
    );

    /**
     * R_USER (omdc_user_session)
     */
    await addIndexSafe(
      queryInterface,
      "omdc_user_session",
      "idx_user_session_status",
      "CREATE INDEX idx_user_session_status ON omdc_user_session (status)"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_user_session",
      "idx_user_session_isAdmin",
      "CREATE INDEX idx_user_session_isAdmin ON omdc_user_session (isAdmin)"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_user_session",
      "idx_user_session_type",
      "CREATE INDEX idx_user_session_type ON omdc_user_session (type(50))"
    );

    /**
     * SUPER_USER (omdc_super_users)
     */
    await addIndexSafe(
      queryInterface,
      "omdc_super_users",
      "idx_superuser_type",
      "CREATE INDEX idx_superuser_type ON omdc_super_users (type(50))"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_super_users",
      "idx_superuser_nm_user",
      "CREATE INDEX idx_superuser_nm_user ON omdc_super_users (nm_user(100))"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_super_users",
      "idx_superuser_departemen",
      "CREATE INDEX idx_superuser_departemen ON omdc_super_users (departemen(50))"
    );
    await addIndexSafe(
      queryInterface,
      "omdc_super_users",
      "idx_superuser_level_user",
      "CREATE INDEX idx_superuser_level_user ON omdc_super_users (level_user(50))"
    );

    /**
     * BARANG (m_barang)
     */
    await addIndexSafe(
      queryInterface,
      "m_barang",
      "idx_barang_status",
      "CREATE INDEX idx_barang_status ON m_barang (sts_brg)"
    );
    await addIndexSafe(
      queryInterface,
      "m_barang",
      "idx_barang_nm_barang",
      "CREATE INDEX idx_barang_nm_barang ON m_barang (nm_barang(100))"
    );
    await addIndexSafe(
      queryInterface,
      "m_barang",
      "idx_barang_barcode",
      "CREATE INDEX idx_barang_barcode ON m_barang (barcode_brg(100))"
    );
    await addIndexSafe(
      queryInterface,
      "m_barang",
      "idx_barang_kdsp",
      "CREATE INDEX idx_barang_kdsp ON m_barang (kdsp(50))"
    );
    await addIndexSafe(
      queryInterface,
      "m_barang",
      "idx_barang_kd_comp",
      "CREATE INDEX idx_barang_kd_comp ON m_barang (kd_comp(50))"
    );
  },

  async down(queryInterface, Sequelize) {
    // remove indexes safely
    const tables = [
      "omdc_reimbursements",
      "omdc_user_session",
      "omdc_super_users",
      "m_barang",
    ];
    const indexes = [
      "idx_reimbursement_no_doc",
      "idx_reimbursement_kode_cabang",
      "idx_reimbursement_requester_id",
      "idx_reimbursement_status",
      "idx_reimbursement_status_finance",
      "idx_reimbursement_tanggal",
      "idx_reimbursement_kdsp",
      "idx_user_session_status",
      "idx_user_session_isAdmin",
      "idx_user_session_type",
      "idx_superuser_type",
      "idx_superuser_nm_user",
      "idx_superuser_departemen",
      "idx_superuser_level_user",
      "idx_barang_status",
      "idx_barang_nm_barang",
      "idx_barang_barcode",
      "idx_barang_kdsp",
      "idx_barang_kd_comp",
    ];

    for (const table of tables) {
      for (const idx of indexes) {
        await queryInterface.sequelize
          .query(`DROP INDEX IF EXISTS ${idx} ON \`${table}\``)
          .catch(() => {});
      }
    }
  },
};
