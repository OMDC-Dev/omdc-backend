const { Op, Sequelize } = require("sequelize");
const db_user = require("../db/user.db");
const { Responder } = require("../utils/responder");
const moment = require("moment");
require("moment/locale/id");
moment.locale("id");
const {
  sendSingleMessage,
  sendMulticastMessage,
} = require("../utils/firebase");
const { decodeToken, getToken } = require("../utils/jwt");

const Reimbursement = db_user.reimbursement;
const User = db_user.ruser;
const INVOICE = db_user.invoice;

exports.get_reimbursement = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    monthyear,
    cari,
    type,
    typePembayaran,
    sort,
    statusCA,
    statusROP,
    periodeStart,
    periodeEnd,
  } = req.query;

  try {
    const whereClause = {};

    // Tipe Pembayaran
    if (typePembayaran) {
      if (typePembayaran == "CASH") {
        whereClause.payment_type = "CASH";
      } else if (typePembayaran == "TRANSFER") {
        whereClause.payment_type = "TRANSFER";
      }
    }

    if (periodeStart && periodeEnd) {
      whereClause.accepted_date = {
        [Op.between]: [periodeStart, periodeEnd],
      };
    }

    // status CA
    if (statusCA) {
      if (statusCA == "DONE") {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: "DONE" },
        ];
      } else {
        whereClause[Op.and] = [
          { status_finance: "DONE" },
          { jenis_reimbursement: "Cash Advance" },
          { status_finance_child: { [Op.ne]: "DONE" } },
        ];
      }
    }

    // status rop
    if (statusROP) {
      console.log("SELECTED STATUS", statusROP);
      if (statusROP == "WAITING") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { makerStatus: "IDLE" },
          { status_finance: { [Op.notIn]: ["DONE", "REJECTED"] } },
        ];
      } else if (statusROP == "APPROVED") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { status_finance: { [Op.notIn]: ["DONE", "REJECTED"] } },
        ];
      } else if (statusROP == "REJECTED") {
        whereClause.status = "REJECTED";
      } else if (statusROP == "DONE") {
        whereClause[Op.and] = [
          { status: "APPROVED" },
          { status_finance: "DONE" },
        ];
      }
    }

    if (type) {
      // whereClause.makerStatus =
      //   type === "WAITING" ? "IDLE" : { [Op.or]: ["APPROVED", "REJECTED"] };

      if (type == "WAITING") {
        whereClause[Op.or] = [
          {
            makerStatus: "IDLE",
          },
          {
            [Op.and]: [
              { makerStatus: "APPROVED" },
              { status_finance: "DONE" },
              { jenis_reimbursement: "Cash Advance" },
              { status_finance_child: "IDLE" },
            ],
          },
        ];
      } else {
        whereClause[Op.or] = [
          {
            [Op.and]: [
              { makerStatus: { [Op.or]: ["APPROVED", "REJECTED"] } },
              { jenis_reimbursement: { [Op.ne]: "Cash Advance" } },
            ],
          },
          {
            [Op.and]: [
              { makerStatus: "APPROVED" },
              { status_finance: "DONE" },
              { jenis_reimbursement: "Cash Advance" },
              { status_finance_child: "DONE" },
            ],
          },
        ];
      }
    }

    if (monthyear) {
      const my = monthyear.split("-");
      const month = my[0];
      const year = my[1];

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (cari && cari.length > 0) {
      const searchSplit = cari.split(" ");
      const searchConditions = searchSplit.map((item) => ({
        [Op.or]: [
          Sequelize.fn(
            "JSON_CONTAINS",
            Sequelize.col("item"),
            `[{"invoice": "${item}"}]`
          ),
          {
            jenis_reimbursement: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            kode_cabang: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            coa: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            nominal: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            no_doc: {
              [Op.like]: `%${item}%`,
            },
          },
          {
            name: {
              [Op.like]: `%${item}%`,
            },
          },
        ],
      }));

      whereClause[Op.and] = searchConditions;
    }

    // Admin already accepted
    whereClause.reviewStatus = "APPROVED";

    // Menambahkan pengurutan berdasarkan tipePembayaran
    const orderClause = [
      ["tipePembayaran", "DESC"], // Mengurutkan dari Urgent ke Regular
      ["createdAt", "DESC"], // Mengurutkan berdasarkan createdAt secara descending
    ];

    const sortClause = Sequelize.literal(`CASE
  WHEN makerStatus = 'WAITING' THEN 1
  WHEN makerStatus = 'IDLE' THEN 1
  ELSE 2
END`);

    let order;

    if (sort) {
      order = [
        sortClause, // First, sort by status
        ["createdAt", "DESC"], // Finally, sort by createdAt
        ["tipePembayaran", "DESC"], // Then sort by tipePembayaran
      ];
    } else {
      order = orderClause;
    }

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    const requested = await Reimbursement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: order,
    });

    // result count
    const resultCount = requested?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    if (requested?.rows.length) {
      Responder(
        res,
        "OK",
        null,
        {
          rows: requested.rows,
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
    } else {
      Responder(res, "OK", null, [], 200);
      return;
    }
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};

exports.acceptMakerReimbursement = async (req, res) => {
  const { id } = req.params;
  const { coa, note, status, bank } = req.body;
  const { authorization } = req.headers;

  try {
    const getReimburse = await Reimbursement.findOne({
      where: {
        id: id,
      },
    });

    const userData = decodeToken(getToken(authorization));

    const getReimburseData = await getReimburse["dataValues"];
    const parentId = getReimburseData.parentId;
    const user_fcm = getReimburseData["requester"]["fcmToken"];
    const currentDate = moment().format("DD-MM-YYYY");
    const items = getReimburseData.item;

    if (status == "REJECTED") {
      // Remove used invoice on rejected
      items.map(async (item) => {
        await INVOICE.destroy({
          where: {
            invoice: item.invoice,
          },
        });
      });

      if (parentId) {
        await Reimbursement.update(
          {
            childId: "",
            childDoc: "",
            realisasi: "",
            maker_approve: currentDate,
            nm_maker_approve: userData.nm_user,
          },
          {
            where: {
              id: parentId,
            },
          }
        );
      }

      await Reimbursement.update(
        {
          makerStatus: status,
          maker_note: note,
          status: "REJECTED",
          maker_approve: currentDate,
          nm_maker_approve: userData.nm_user,
        },
        {
          where: {
            id: id,
          },
        }
      );

      sendSingleMessage(user_fcm, {
        title: "Pengajuan request of payment anda telah ditolak!",
        body: "Pengajuan request of payment anda telah di tolak oleh maker, mohon periksa kembali data anda!",
      });

      Responder(res, "OK", null, { accepted: true }, 200);
      return;
    }
    // =============== ADMIN SECTION

    // === HANDLE NOTIF TO FINANCE
    const getFinanceSession = await User.findAll({
      where: {
        type: "FINANCE",
      },
      attributes: ["fcmToken"],
    });

    if (getFinanceSession) {
      let tokens = [];

      for (let i = 0; i < getFinanceSession.length; i++) {
        if (getFinanceSession[i].fcmToken) {
          tokens.push(getFinanceSession[i].fcmToken);
        }
      }

      if (tokens.length) {
        sendMulticastMessage(tokens, {
          title: "Ada pengajuan request of payment baru!",
          body: "Ada pengajuan request of payment yang telah disetujui oleh penyetuju dan menunggu untuk diproses!",
        });
      }
    }

    await Reimbursement.update(
      {
        coa: coa,
        maker_note: note,
        makerStatus: status,
        finance_bank: bank,
        maker_approve: currentDate,
        nm_maker_approve: userData.nm_user,
      },
      {
        where: {
          id: id,
        },
      }
    );

    Responder(res, "OK", null, { accepted: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 500);
    return;
  }
};
