const db = require("../../db/user.db");
const { Responder } = require("../../utils/responder");
const M_KEMASAN = db.kemasan;

exports.getKemasan = async (req, res) => {
  const { page = 1, limit = 500 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const whereClause = {};

    const datas = await M_KEMASAN.findAndCountAll({
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
      label: row.nm_kemasan,
      value: row.nm_kemasan,
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
