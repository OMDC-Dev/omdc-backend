const { Op, Sequelize } = require("sequelize");
const db = require("../../db/user.db");
const { WORKPLAN_STATUS } = require("../../utils/constants");
const { Responder } = require("../../utils/responder");
const {
  checkUserAuth,
  getUserDatabyToken,
  getFormattedDate,
  generateRandomNumber,
  getCurrentDate,
} = require("../../utils/utils");
const { uploadImagesCloudinary } = require("../../utils/cloudinary");
const {
  sendMulticastMessage,
  sendSingleMessage,
} = require("../../utils/firebase");
const WORKPLAN_DB = db.workplan;
const CABANG_DB = db.cabang;
const USER_SESSION_DB = db.ruser;
const WORKPLAN_DATE_HISTORY_DB = db.workplan_date_history;
const WORKPLAN_COMMENT_DB = db.workplan_comment;
const WORKPLAN_CC_DB = db.workplan_cc_users;
const WORKPLAN_PROGRESS_DB = db.workplan_progress;

// --  Create work plan
exports.create_workplan = async (req, res) => {
  const {
    jenis_workplan,
    tanggal_mulai,
    tanggal_selesai,
    kd_induk,
    perihal,
    kategori,
    user_cc,
    attachment_before,
  } = req.body;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    const WORKPLAN_ID = `WP-${getFormattedDate()}-${generateRandomNumber(
      1000000,
      9999999
    )}`;

    let UPLOAD_IMAGE_BEFORE;

    if (attachment_before) {
      UPLOAD_IMAGE_BEFORE = await uploadImagesCloudinary(attachment_before);
    }

    // 1. Buat Workplan
    const workplan = await WORKPLAN_DB.create({
      workplan_id: WORKPLAN_ID,
      jenis_workplan,
      tanggal_mulai,
      tanggal_selesai,
      kd_induk,
      perihal: perihal.toUpperCase(),
      kategori: kategori.toUpperCase(),
      iduser: userData.iduser,
      attachment_before: UPLOAD_IMAGE_BEFORE?.secure_url ?? "",
      status: WORKPLAN_STATUS.ON_PROGRESS,
    });

    // 2. Simpan riwayat tanggal selesai workplan
    await WORKPLAN_DATE_HISTORY_DB.create({
      wp_id: workplan.id,
      date: tanggal_selesai,
    });

    // 3. Tambahkan user_cc ke tabel workplan_cc_users jika ada
    let fcmTokens = [];
    if (user_cc && user_cc.length > 0) {
      const ccUsers = user_cc.map((userId) => ({
        workplan_id: workplan.id,
        user_id: userId,
      }));

      await WORKPLAN_CC_DB.bulkCreate(ccUsers);

      // 4. Ambil FCM Token dari tabel session berdasarkan iduser
      const usersWithToken = await USER_SESSION_DB.findAll({
        attributes: ["fcmToken"],
        where: { iduser: user_cc }, // Ambil semua user yang ada dalam CC
        raw: true,
      });

      // 5. Ambil hanya token yang valid
      fcmTokens = usersWithToken.map((user) => user.fcmToken).filter(Boolean);
    }

    // 6. Kirim Notifikasi jika ada FCM Token
    if (fcmTokens.length > 0) {
      sendMulticastMessage(
        fcmTokens,
        {
          title: `Anda ditambahkan ke Workplan!`,
          body: `Anda baru saja ditambahkan ke cc workplan oleh ${userData.nm_user}.`,
        },
        {
          name: "WorkplanStack",
          screen: "WorkplanDetail",
          params: JSON.stringify({
            id: workplan.id.toString(),
            cc: "1",
          }),
        }
      );
    }

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

// -- Get Workplan
exports.get_workplan = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    admin,
    search,
    cc,
    id,
    fKategori,
    fType,
    fCabang,
    fStatus,
  } = req.query;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    // Menghitung offset berdasarkan halaman dan batasan
    const offset = (page - 1) * limit;

    let whereCluse = {};

    // -- handle if user
    if (!admin && !cc && !id) {
      whereCluse.iduser = userData.iduser;
    }

    if (status) {
      if (admin && status == WORKPLAN_STATUS.FINISH) {
        console.log("ADMIN  FINISH");
        whereCluse.status = {
          [Op.or]: [WORKPLAN_STATUS.FINISH, WORKPLAN_STATUS.REJECTED],
        };
      } else {
        console.log("TO", status.split(",").length);
        if (status.split(",").length > 1) {
          whereCluse.status = {
            [Op.or]: status.split(","),
          };
        } else {
          whereCluse.status = status;
        }
      }
    }

    if (fCabang || fStatus || fKategori || fType) {
      let filter = [];

      if (fCabang) {
        filter.push({ kd_induk: fCabang });
      }

      if (fStatus) {
        filter.push({ status: fStatus });
      }

      if (fKategori) {
        filter.push({
          kategori: fKategori.toUpperCase(),
        });
      }

      if (fType) {
        filter.push({
          jenis_workplan: fType.toUpperCase(),
        });
      }

      whereCluse[Op.and] = filter;
    }

    // if (cc && !admin && !id) {
    //   whereCluse[Op.and] = [
    //     Sequelize.fn(
    //       "JSON_CONTAINS",
    //       Sequelize.col("user_cc"),
    //       `[{"iduser": "${cc}"}]`
    //     ),
    //   ];
    // }

    // -- search
    if (search) {
      whereCluse[Op.or] = [
        { workplan_id: { [Op.like]: `%${search}%` } },
        { perihal: { [Op.like]: `%${search}%` } },
        { kd_induk: { [Op.like]: `%${search}%` } },
        { tanggal_selesai: { [Op.like]: `%${search}%` } },
        { tanggal_mulai: { [Op.like]: `%${search}%` } },
        { "$cabang_detail.nm_induk$": { [Op.like]: `%${search}%` } },
        { "$user_detail.nm_user$": { [Op.like]: `%${search}%` } },
        //Sequelize.literal(`cabang_detail.nm_induk LIKE '%${search}%'`),
        //Sequelize.literal(`user_detail.nm_user LIKE '%${search}%'`),
      ];
    }

    let LEFT_JOIN_TABLE = [
      {
        model: CABANG_DB,
        as: "cabang_detail",
        required: !!search, // left join
        attributes: ["kd_induk", "nm_induk"],
      },
      {
        model: USER_SESSION_DB,
        as: "user_detail",
        required: !!search, // left join
        attributes: ["nm_user", "fcmToken"],
      },
    ];

    if (id) {
      // if (!admin) {
      //   whereCluse.iduser = userData.iduser;
      // }

      whereCluse.id = id;

      LEFT_JOIN_TABLE.push({
        model: WORKPLAN_DATE_HISTORY_DB,
        as: "workplant_date_history",
        attributes: ["date", "createdAt"],
      });

      LEFT_JOIN_TABLE.push({
        model: WORKPLAN_COMMENT_DB,
        as: "workplant_comment",
        required: false,
        where: { replies_to: null },
        include: [
          {
            model: WORKPLAN_COMMENT_DB,
            as: "replies",
            required: false,
          },
        ],
      });

      LEFT_JOIN_TABLE.push({
        model: USER_SESSION_DB,
        as: "cc_users",
        required: false,
        attributes: ["nm_user", "fcmToken", "iduser"],
      });
    }

    if (cc) {
      LEFT_JOIN_TABLE.push({
        model: USER_SESSION_DB,
        as: "cc_users",
        required: true, // INNER JOIN, jadi hanya workplan yang memiliki CC cocok yang muncul
        where: {
          iduser: userData.iduser, // Hanya workplan di mana user termasuk CC
        },
        attributes: ["nm_user", "fcmToken", "iduser"],
      });
    }

    const requested = await WORKPLAN_DB.findAndCountAll({
      where: whereCluse,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: [
        ["kategori", "DESC"],
        ["updatedAt", "DESC"],
        ["createdAt", "DESC"],
        ["status", "ASC"],
      ],
      include: LEFT_JOIN_TABLE,
    });

    // result count
    const resultCount = requested?.count;

    const totalPage = resultCount / limit;
    const totalPageFormatted =
      Math.round(totalPage) == 0 ? 1 : Math.ceil(totalPage);

    const singleResult = requested.rows[0] ?? [];

    Responder(
      res,
      "OK",
      null,
      id
        ? singleResult
        : {
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
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

// -- Update CC
exports.update_workplan = async (req, res) => {
  const {
    user_cc,
    attachment_after,
    attachment_before,
    tanggal_selesai,
    isUpdateAfter,
  } = req.body;
  const { id } = req.params;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    let UPLOAD_IMAGE_AFTER;
    let UPLOAD_IMAGE_BEFORE;

    const getExt = await WORKPLAN_DB.findOne({
      where: {
        id: id,
      },
    });

    const getExtData = await getExt["dataValues"];

    // Upload attachment_after jika memenuhi syarat
    if (attachment_after && (isUpdateAfter || !getExtData.attachment_after)) {
      UPLOAD_IMAGE_AFTER = await uploadImagesCloudinary(attachment_after);
    }

    if (attachment_before && !getExtData.attachment_before) {
      UPLOAD_IMAGE_BEFORE = await uploadImagesCloudinary(attachment_before);
    }

    // 1. Ambil User CC Lama dari Database
    const oldCCUsers = await WORKPLAN_CC_DB.findAll({
      attributes: ["user_id"],
      where: { workplan_id: id },
      raw: true,
    });
    const oldUserCC = oldCCUsers.map((user) => user.user_id); // Array ID user lama

    // 2. Update Workplan
    await WORKPLAN_DB.update(
      {
        attachment_after:
          UPLOAD_IMAGE_AFTER?.secure_url ?? getExtData.attachment_after ?? "",
        attachment_before:
          UPLOAD_IMAGE_BEFORE?.secure_url ?? getExtData.attachment_before ?? "",
        tanggal_selesai: tanggal_selesai,
        status:
          getExtData.status == WORKPLAN_STATUS.REVISON
            ? WORKPLAN_STATUS.ON_PROGRESS
            : getExtData.status,
      },
      { where: { id: id } }
    );

    // 3. Tambahkan ke history jika tanggal_selesai diubah
    if (tanggal_selesai) {
      await WORKPLAN_DATE_HISTORY_DB.create({
        date: tanggal_selesai,
        wp_id: id,
      });
    }

    // 4. Update User CC
    let newCCUsers = [];
    let fcmTokens = [];
    if (user_cc && Array.isArray(user_cc)) {
      // Hapus semua user CC lama dari database
      await WORKPLAN_CC_DB.destroy({ where: { workplan_id: id } });

      // Simpan user CC baru
      newCCUsers = user_cc.map((userId) => ({
        workplan_id: id,
        user_id: userId,
      }));
      await WORKPLAN_CC_DB.bulkCreate(newCCUsers);

      // 5. Cari user yang baru ditambahkan (tidak ada di oldUserCC)
      const newlyAddedUsers = user_cc.filter(
        (userId) => !oldUserCC.includes(userId)
      );

      if (newlyAddedUsers.length > 0) {
        // 6. Ambil FCM Token dari session untuk user baru saja
        const usersWithToken = await USER_SESSION_DB.findAll({
          attributes: ["fcmToken"],
          where: { iduser: newlyAddedUsers }, // Hanya ambil user baru
          raw: true,
        });

        // 7. Ambil hanya token yang valid
        fcmTokens = usersWithToken.map((user) => user.fcmToken).filter(Boolean);
      }
    }

    // 8. Kirim Notifikasi hanya ke user yang baru ditambahkan
    if (fcmTokens.length > 0) {
      sendMulticastMessage(
        fcmTokens,
        {
          title: `Anda ditambahkan ke Workplan!`,
          body: `Anda baru saja ditambahkan ke cc workplan oleh ${userData.nm_user}.`,
        },
        {
          name: "WorkplanStack",
          screen: "WorkplanDetail",
          params: JSON.stringify({
            id: workplan.id.toString(),
            cc: "1",
          }),
        }
      );
    }

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.update_status = async (req, res) => {
  const { status, fromAdmin } = req.body;
  const { id } = req.params;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    await WORKPLAN_DB.update(
      {
        approved_date:
          status != WORKPLAN_STATUS.PENDING &&
          status != WORKPLAN_STATUS.REVISON &&
          status != WORKPLAN_STATUS.ON_PROGRESS
            ? getCurrentDate()
            : null,
        status: status,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (fromAdmin) {
      const getWorkplan = await WORKPLAN_DB.findOne({
        where: { id: id },
        include: [
          {
            model: USER_SESSION_DB,
            as: "user_detail",
            required: !!search, // left join
            attributes: ["nm_user", "fcmToken"],
          },
        ],
      });
      const getWorkplanData = await getWorkplan["dataValues"];

      const userToken = getWorkplanData["user_detail"]["fcmToken"];

      if (userToken) {
        let status_text = "";

        if (status == WORKPLAN_STATUS.FINISH) {
          status_text = "disetujui";
        } else if (status == WORKPLAN_STATUS.REJECTED) {
          status_text = "ditolak";
        } else if (status == WORKPLAN_STATUS.REVISON) {
          status_text = "perlu direvisi";
        }

        sendSingleMessage(
          userToken,
          {
            title: "Update status workplan anda!",
            body: `Status workplan anda saat ini adalah ${status_text}`,
          },
          {
            name: "WorkplanStack",
            screen: "WorkplanDetail",
            params: JSON.stringify({
              id: workplan.id.toString(),
            }),
          }
        );
      }
    }

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

// -- Get CC User
exports.get_cc_user = async (req, res) => {
  const { authorization } = req.headers;
  const { selectedList } = req.body;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    const whereCondition = {
      [Op.and]: [
        Sequelize.literal("JSON_SEARCH(kodeAkses, 'one', '1200') IS NULL"),
        { iduser: { [Op.ne]: userData.iduser } },
      ],
    };

    // Jika selectedList ada dan berbentuk array, tambahkan filter untuk mengecualikan iduser yang ada di dalamnya
    if (Array.isArray(selectedList) && selectedList.length > 0) {
      whereCondition[Op.and].push({ iduser: { [Op.notIn]: selectedList } });
    }

    const data = await USER_SESSION_DB.findAll({ where: whereCondition });

    Responder(res, "OK", null, data, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.delete_workplan = async (req, res) => {
  const { id } = req.params;
  const { authorization } = req.headers;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    await WORKPLAN_DB.destroy({
      where: {
        id: id,
      },
    });

    await WORKPLAN_PROGRESS_DB.destroy({
      where: {
        wp_id: id,
      },
    });

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
