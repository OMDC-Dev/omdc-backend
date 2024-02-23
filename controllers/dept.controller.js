const db = require("../db/user.db");
const { decodeToken, getToken } = require("../utils/jwt");
const { Responder } = require("../utils/responder");
const Dept = db.dept;

// Create and Save
exports.create = async (req, res) => {
  const { name } = req.query;
  try {
    await Dept.create({
      label: name,
    });

    Responder(res, "OK", null, "Berhasil menambahkan departemen baru", 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, "Gagal menambahkan departemen baru", 400);
    return;
  }
};

exports.get = async (req, res) => {
  const { page = 1, limit = 25 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const datas = await Dept.findAndCountAll({
      order: [["createdAt", "DESC"]],
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

exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    await Dept.destroy({
      where: {
        id: id,
      },
    });

    Responder(res, "OK", null, { message: "Data berhasil dihapus!" }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
