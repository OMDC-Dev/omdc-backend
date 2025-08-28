"use strict";

async function addIndexSmart(
  queryInterface,
  table,
  indexName,
  column,
  prefix = 100
) {
  // cek apakah kolom ada
  const [columns] = await queryInterface.sequelize.query(
    `SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`
  );
  if (columns.length === 0) return;

  const colType = columns[0].Type.toLowerCase();

  // buat query index sesuai tipe kolom
  let sql;
  if (colType.includes("text") || colType.includes("blob")) {
    sql = `CREATE INDEX ${indexName} ON \`${table}\` (${column}(${prefix}))`;
  } else {
    sql = `CREATE INDEX ${indexName} ON \`${table}\` (${column})`;
  }

  // cek apakah index sudah ada
  const [exists] = await queryInterface.sequelize.query(
    `SHOW INDEX FROM \`${table}\` WHERE Key_name = '${indexName}'`
  );

  if (exists.length === 0) {
    await queryInterface.sequelize.query(sql);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // contoh di reimbursement
    await addIndexSmart(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_no_doc",
      "no_doc"
    );
    await addIndexSmart(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_kode_cabang",
      "kode_cabang",
      50
    );
    await addIndexSmart(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_requester_id",
      "requester_id",
      50
    );
    await addIndexSmart(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_status",
      "status"
    );
    await addIndexSmart(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_status_finance",
      "status_finance"
    );
    await addIndexSmart(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_tanggal",
      "tanggal_reimbursement",
      20
    );
    await addIndexSmart(
      queryInterface,
      "omdc_reimbursements",
      "idx_reimbursement_kdsp",
      "kdsp",
      20
    );

    // user_session
    await addIndexSmart(
      queryInterface,
      "omdc_user_session",
      "idx_user_session_status",
      "status"
    );
    await addIndexSmart(
      queryInterface,
      "omdc_user_session",
      "idx_user_session_isAdmin",
      "isAdmin"
    );
    await addIndexSmart(
      queryInterface,
      "omdc_user_session",
      "idx_user_session_type",
      "type",
      50
    );

    // super_users
    await addIndexSmart(
      queryInterface,
      "omdc_super_users",
      "idx_superuser_type",
      "type",
      50
    );
    await addIndexSmart(
      queryInterface,
      "omdc_super_users",
      "idx_superuser_nm_user",
      "nm_user",
      100
    );
    await addIndexSmart(
      queryInterface,
      "omdc_super_users",
      "idx_superuser_departemen",
      "departemen",
      50
    );
    await addIndexSmart(
      queryInterface,
      "omdc_super_users",
      "idx_superuser_level_user",
      "level_user",
      50
    );

    // barang
    await addIndexSmart(
      queryInterface,
      "m_barang",
      "idx_barang_status",
      "sts_brg"
    );
    await addIndexSmart(
      queryInterface,
      "m_barang",
      "idx_barang_nm_barang",
      "nm_barang",
      100
    );
    await addIndexSmart(
      queryInterface,
      "m_barang",
      "idx_barang_barcode",
      "barcode_brg",
      100
    );
    await addIndexSmart(
      queryInterface,
      "m_barang",
      "idx_barang_kdsp",
      "kdsp",
      50
    );
    await addIndexSmart(
      queryInterface,
      "m_barang",
      "idx_barang_kd_comp",
      "kd_comp",
      50
    );
  },

  async down(queryInterface, Sequelize) {
    const dropIndexes = [
      // reimbursements
      ["omdc_reimbursements", "idx_reimbursement_no_doc"],
      ["omdc_reimbursements", "idx_reimbursement_kode_cabang"],
      ["omdc_reimbursements", "idx_reimbursement_requester_id"],
      ["omdc_reimbursements", "idx_reimbursement_status"],
      ["omdc_reimbursements", "idx_reimbursement_status_finance"],
      ["omdc_reimbursements", "idx_reimbursement_tanggal"],
      ["omdc_reimbursements", "idx_reimbursement_kdsp"],

      // user_session
      ["omdc_user_session", "idx_user_session_status"],
      ["omdc_user_session", "idx_user_session_isAdmin"],
      ["omdc_user_session", "idx_user_session_type"],

      // super_users
      ["omdc_super_users", "idx_superuser_type"],
      ["omdc_super_users", "idx_superuser_nm_user"],
      ["omdc_super_users", "idx_superuser_departemen"],
      ["omdc_super_users", "idx_superuser_level_user"],

      // barang
      ["m_barang", "idx_barang_status"],
      ["m_barang", "idx_barang_nm_barang"],
      ["m_barang", "idx_barang_barcode"],
      ["m_barang", "idx_barang_kdsp"],
      ["m_barang", "idx_barang_kd_comp"],
    ];

    for (const [table, index] of dropIndexes) {
      await queryInterface.sequelize
        .query(`DROP INDEX IF EXISTS ${index} ON \`${table}\``)
        .catch(() => {});
    }
  },
};
