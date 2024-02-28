const USER_DB = require("../db/user.db");
const { Responder } = require("../utils/responder");

const M_SUPLIER = USER_DB.suplier;

// GET SUPPLIER LIST
exports.getSuplier = async (req, res) => {
  const { page = 1, limit = 25 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const whereClause = {
      status: "Aktif",
    };

    const datas = await M_SUPLIER.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
    });

    // result count
    const resultCount = datas?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.round(totalPage);

    Responder(
      res,
      "OK",
      null,
      {
        rows: datas.rows,
        pageInfo: {
          pageNumber: page,
          pageLimit: limit,
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

exports.getSuplierDetail = async (req, res) => {
  const { kdsp } = req.params;

  try {
    const datas = await M_SUPLIER.findOne({
      where: {
        kdsp: kdsp,
      },
    });

    const dataValue = datas["dataValues"];

    Responder(res, "OK", null, dataValue, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
