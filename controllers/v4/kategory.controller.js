const db = require("../../db/user.db");
const { Responder } = require("../../utils/responder");
const M_KATEGORY = db.kategory;

exports.getKategory = async (req, res) => {
  const { page = 1, limit = 500 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const whereClause = {};

    const datas = await M_KATEGORY.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
    });

    // result count
    const resultCount = datas?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    // Modify the rows to contain label and value properties
    const modifiedRows = datas.rows.map((row) => ({
      label: row.kategory_brg,
      value: row.kategory_brg,
    }));

    Responder(
      res,
      "OK",
      null,
      {
        rows: modifiedRows,
        pageInfo: {
          pageNumber: parseInt(page),
          pageLimit: parseInt(limit),
          pageCount: totalPageFormatted,
          pageSize: resultCount,
        },
      },
      200
    );
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
