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

//
const moment = require("moment");
const { uploadToCPanel } = require("../../utils/uploadToCPanel");
require("moment/locale/id");
moment.locale("id");
//

const WORKPLAN_DB = db.workplan;
const CABANG_DB = db.cabang;
const USER_SESSION_DB = db.ruser;
const WORKPLAN_DATE_HISTORY_DB = db.workplan_date_history;
const WORKPLAN_COMMENT_DB = db.workplan_comment;
const WORKPLAN_CC_DB = db.workplan_cc_users;
const WORKPLAN_PROGRESS_DB = db.workplan_progress;
const PENGUMUMAN_DB = db.pengumuman;
const WORKPLAN_ATTACHMENT = db.workplan_attachment;

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
    custom_location,
    group,
    is_multi,
    files,
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

    if (attachment_before && !is_multi) {
      UPLOAD_IMAGE_BEFORE = await uploadImagesCloudinary(attachment_before);
    }
    // 1. Buat Workplan
    const workplan = await WORKPLAN_DB.create({
      workplan_id: WORKPLAN_ID,
      jenis_workplan: jenis_workplan, // set to auto non approval
      tanggal_mulai,
      tanggal_selesai,
      kd_induk: kd_induk ?? null,
      perihal: perihal.toUpperCase(),
      kategori: kategori.toUpperCase(),
      iduser: userData.iduser,
      attachment_before: UPLOAD_IMAGE_BEFORE?.secure_url ?? "",
      status: WORKPLAN_STATUS.ON_PROGRESS,
      custom_location: custom_location ?? null,
      last_update: getCurrentDate(),
      last_update_by: userData.nm_user,
      group_type: group,
    });

    // handle new attachment
    if (is_multi && files) {
      const temp = await Promise.all(
        files.map(async (item) => {
          const imageUrl = await uploadToCPanel(
            item["base64"],
            `${WORKPLAN_ID}.jpg`
          );
          if (imageUrl) {
            return {
              imageUrl: imageUrl,
              caption: item["caption"],
            };
          }
          return null;
        })
      );

      const filtered = temp.filter((item) => item !== null);

      for (const item of filtered) {
        await WORKPLAN_ATTACHMENT.create({
          workplan_id: workplan.id,
          image_url: item["imageUrl"],
          caption: item["caption"],
        });
      }
    }

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
          title: `Anda ditambahkan ke Work In Progress baru oleh ${userData.nm_user}`,
          body: `Perihal:\n${workplan?.perihal}`,
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

    // Send Notif to admin
    const adminSessions = await USER_SESSION_DB.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("fcmToken")), "fcmToken"],
      ],
      where: Sequelize.literal(`JSON_CONTAINS(kodeAkses, '"1200"')`),
    });

    // ubah hasil ke array fcmToken
    const adminFcmTokens = adminSessions.map((session) => session.fcmToken);

    if (adminFcmTokens.length > 0) {
      sendMulticastMessage(
        adminFcmTokens,
        {
          title: `Pengajuan Work In Progress Baru dari ${userData["nm_user"]}`,
          body: `Perihal:\n${workplan?.perihal}`,
        },
        {
          name: "WorkplanStack",
          screen: "WorkplanDetail",
          params: JSON.stringify({
            id: workplan.id.toString(),
            admin: "1",
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
    sort,
    cc,
    id,
    fKategori,
    fType,
    fCabang,
    fStatus,
    startDate,
    endDate,
    group,
    onDueDate,
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
      const today = moment().startOf("day");

      if (onDueDate) {
        whereCluse[Op.and] = [
          {
            status: {
              [Op.notIn]: [
                WORKPLAN_STATUS.FINISH,
                WORKPLAN_STATUS.REJECTED,
                WORKPLAN_STATUS.PENDING,
              ],
            },
          },
          {
            [Op.or]: [
              Sequelize.literal(
                `STR_TO_DATE(tanggal_selesai, '%d-%m-%Y') <= '${today.format(
                  "YYYY-MM-DD"
                )}'`
              ),
            ],
          },
        ];
      } else {
        if (status == WORKPLAN_STATUS.FINISH) {
          whereCluse.status = {
            [Op.or]: [WORKPLAN_STATUS.FINISH, WORKPLAN_STATUS.REJECTED],
          };
        } else if (status == WORKPLAN_STATUS.PENDING) {
          whereCluse.status = WORKPLAN_STATUS.PENDING;
        } else {
          const statusArray = status.split(",");
          const statusCondition =
            statusArray.length > 1 ? { [Op.or]: statusArray } : status;

          whereCluse[Op.and] = [
            {
              status: statusCondition,
            },
            {
              [Op.or]: [
                Sequelize.literal(`
              STR_TO_DATE(tanggal_selesai, '%d-%m-%Y') > '${today.format(
                "YYYY-MM-DD"
              )}'
              OR tanggal_selesai IS NULL
            `),
              ],
            },
          ];
        }
      }
    }

    if (group) {
      if (group == "MEDIC") {
        whereCluse.group_type = group;
      } else {
        whereCluse.group_type = {
          [Op.or]: [
            { [Op.eq]: "NON_MEDIC" },
            { [Op.is]: null },
            { [Op.eq]: "" },
          ],
        };
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
      // whereCluse[Op.or] = [
      //   { workplan_id: { [Op.like]: `%${search}%` } },
      //   { custom_location: { [Op.like]: `%${search}%` } },
      //   { perihal: { [Op.like]: `%${search}%` } },
      //   { kd_induk: { [Op.like]: `%${search}%` } },
      //   { tanggal_selesai: { [Op.like]: `%${search}%` } },
      //   { tanggal_mulai: { [Op.like]: `%${search}%` } },
      //   { "$cabang_detail.nm_induk$": { [Op.like]: `%${search}%` } },
      //   { "$user_detail.nm_user$": { [Op.like]: `%${search}%` } },
      //   //Sequelize.literal(`cabang_detail.nm_induk LIKE '%${search}%'`),
      //   //Sequelize.literal(`user_detail.nm_user LIKE '%${search}%'`),
      // ];
      whereCluse[Op.or] = [
        { workplan_id: { [Op.like]: `%${search}%` } },
        { custom_location: { [Op.like]: `%${search}%` } },
        { perihal: { [Op.like]: `%${search}%` } },
        { kd_induk: { [Op.like]: `%${search}%` } },
        { tanggal_selesai: { [Op.like]: `%${search}%` } },
        { tanggal_mulai: { [Op.like]: `%${search}%` } },
        { "$user_detail.nm_user$": { [Op.like]: `%${search}%` } },
        {
          [Op.and]: [
            { kd_induk: { [Op.ne]: null } },
            { "$cabang_detail.nm_induk$": { [Op.like]: `%${search}%` } },
          ],
        },
      ];
    }

    let LEFT_JOIN_TABLE = [
      {
        model: CABANG_DB,
        as: "cabang_detail",
        required: false, // left join
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

    let ORDER_DEFAULT = [
      ["kategori", "DESC"],
      ["updatedAt", "DESC"],
      ["createdAt", "DESC"],
      ["status", "ASC"],
    ];

    if (sort) {
      if (sort == "CREATEDDESC") {
        ORDER_DEFAULT = [
          ["createdAt", "DESC"],
          ["updatedAt", "DESC"],
          ["kategori", "DESC"],
        ];
      }
    }

    if (admin) {
      console.log("ORDER");
      ORDER_DEFAULT = [["perihal", "ASC"]];
    }

    if (startDate && endDate) {
      const startDateObj = moment(startDate, "DD-MM-YYYY", true)
        .startOf("day")
        .toDate();

      const endDateObj = moment(endDate, "DD-MM-YYYY", true)
        .endOf("day")
        .toDate();

      whereCluse.createdAt = {
        [Op.between]: [startDateObj, endDateObj],
      };
    }

    const requested = await WORKPLAN_DB.findAndCountAll({
      where: whereCluse,
      limit: parseInt(limit), // Mengubah batasan menjadi tipe numerik
      offset: offset, // Menetapkan offset untuk penampilan halaman
      order: ORDER_DEFAULT,
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
    perihal,
    attachment_after,
    attachment_before,
    tanggal_selesai,
    isUpdateAfter,
    kd_induk,
    location,
    group,
    files,
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
        perihal: perihal,
        attachment_after:
          UPLOAD_IMAGE_AFTER?.secure_url ?? getExtData.attachment_after ?? "",
        attachment_before:
          UPLOAD_IMAGE_BEFORE?.secure_url ?? getExtData.attachment_before ?? "",
        tanggal_selesai: tanggal_selesai,
        status:
          getExtData.status == WORKPLAN_STATUS.REVISON
            ? WORKPLAN_STATUS.ON_PROGRESS
            : getExtData.status,
        last_update: getCurrentDate(),
        last_update_by: userData.nm_user,
        kd_induk: kd_induk ?? null,
        custom_location: location ?? null,
        group_type: group,
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
          title: `Anda ditambahkan ke Work in progress!`,
          body: `Anda baru saja ditambahkan ke cc work in progress oleh ${userData.nm_user}.`,
        },
        {
          name: "WorkplanStack",
          screen: "WorkplanDetail",
          params: JSON.stringify({
            id: id.toString(),
            cc: "1",
          }),
        }
      );
    }

    if (files) {
      const newFile = files.filter((item) => !item.id);
      const keptFileIds = files
        .filter((item) => item.id)
        .map((item) => item.id);

      // 1. Ambil semua attachment lama dari DB
      const existingAttachments = await WORKPLAN_ATTACHMENT.findAll({
        where: { workplan_id: id },
      });

      // 2. Cari file yang dihapus (id lama yang tidak ada di keptFileIds)
      const deletedAttachments = existingAttachments.filter(
        (item) => !keptFileIds.includes(item.id)
      );

      // 3. Hapus dari DB
      for (const attachment of deletedAttachments) {
        await WORKPLAN_ATTACHMENT.destroy({
          where: { id: attachment.id },
        });
      }

      // 4. Upload file baru
      if (newFile.length > 0) {
        const uploaded = await Promise.all(
          newFile.map(async (item) => {
            const image = await uploadToCPanel(
              item["base64"],
              `${getExtData["workplan_id"]}.jpg`
            );
            if (image) {
              return {
                imageUrl: image,
                caption: item["caption"],
              };
            }
            return null;
          })
        );

        const validUploads = uploaded.filter((item) => item !== null);

        for (const item of validUploads) {
          await WORKPLAN_ATTACHMENT.create({
            workplan_id: id,
            image_url: item["imageUrl"],
            caption: item["caption"],
          });
        }
      }
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
          status != WORKPLAN_STATUS.ON_PROGRESS &&
          status != WORKPLAN_STATUS.NEED_APPROVAL &&
          status != WORKPLAN_STATUS.APPROVED
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
            required: false, // left join
            attributes: ["nm_user", "fcmToken"],
          },
        ],
      });
      const getWorkplanData = await getWorkplan["dataValues"];

      const userToken = getWorkplanData["user_detail"]["fcmToken"];
      const workplanPerihal = getWorkplanData["perihal"];

      if (userToken) {
        let status_text = "";

        if (status == WORKPLAN_STATUS.FINISH) {
          status_text = `Disetujui: ${workplanPerihal}\n\noleh ${userData["nm_user"]}`;
        } else if (status == WORKPLAN_STATUS.REJECTED) {
          status_text = `Ditolak: ${workplanPerihal}\n\noleh ${userData["nm_user"]}`;
        } else if (status == WORKPLAN_STATUS.REVISON) {
          status_text = `Revisi: ${workplanPerihal}\nMohon segera revisi\n\noleh ${userData["nm_user"]}`;
        }

        sendSingleMessage(
          userToken,
          {
            title: "Update status Work In Progress",
            body: `Status work in progress anda dengan nomor ${getWorkplanData.workplan_id} saat ini adalah ${status_text}\n Perihal:\n${workplanPerihal}`,
          },
          {
            name: "WorkplanStack",
            screen: "WorkplanDetail",
            params: JSON.stringify({
              id: id.toString(),
            }),
          }
        );
      }
    }

    Responder(res, "OK", null, { success: true }, 200);
    return;
  } catch (error) {
    console.log(error);
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

// -- Get CC User
exports.get_cc_user = async (req, res) => {
  const { authorization } = req.headers;
  const { selectedList } = req.body;
  const { ownerId } = req.query;
  try {
    const userData = getUserDatabyToken(authorization);
    const userAuth = checkUserAuth(userData);

    if (userAuth.error) {
      return Responder(res, "ERROR", userAuth.message, null, 401);
    }

    console.log("EX", [userData.iduser, ownerId]);

    const whereCondition = {
      [Op.and]: [
        Sequelize.literal("JSON_SEARCH(kodeAkses, 'one', '1200') IS NULL"),
        { iduser: { [Op.notIn]: [userData.iduser, ownerId] } },
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

exports.get_workplan_schedule = async (req, res) => {
  try {
    const today = moment().startOf("day");

    let LEFT_JOIN_TABLE = [
      {
        model: USER_SESSION_DB,
        as: "user_detail",
        attributes: ["nm_user", "fcmToken"],
        required: false,
      },
    ];

    const workplanList = await WORKPLAN_DB.findAll({
      attributes: [
        [Sequelize.col("workplan.iduser"), "iduser"],
        [Sequelize.fn("COUNT", Sequelize.col("workplan.iduser")), "count"],
      ],
      where: {
        [Op.and]: [
          {
            status: {
              [Op.notIn]: [WORKPLAN_STATUS.FINISH, WORKPLAN_STATUS.REJECTED],
            },
          },
          {
            [Op.or]: [
              Sequelize.literal(
                `STR_TO_DATE(tanggal_selesai, '%d-%m-%Y') <= '${today.format(
                  "YYYY-MM-DD"
                )}'`
              ),
            ],
          },
        ],
      },
      group: ["workplan.iduser"],
      include: LEFT_JOIN_TABLE,
    });

    const results = workplanList.map((row) => ({
      iduser: row.iduser,
      count: parseInt(row.dataValues.count, 10),
      fcmToken: row.user_detail?.fcmToken || null,
    }));

    for (let i = 0; i < results.length; i++) {
      if (results[i]?.fcmToken?.length > 0) {
        console.log("Sending Notification Schedule to User", results[i].iduser);
        sendSingleMessage(
          results[i].fcmToken,
          {
            title: `Work in progress anda memasuki tanggal due date`,
            body: `Anda memiliki ${results[i].count} work in progress yang memasuki tanggal due date, silahkan lakukan update!`,
          },
          {
            name: "WorkplanStack",
            screen: "WorkplanList",
            params: JSON.stringify({}),
          }
        );
      } else {
        console.log(`User ${results[i].iduser} not logged in`);
      }
    }

    // ADMIN SECTION
    const totalDueDataMedic = await WORKPLAN_DB.count({
      where: {
        [Op.and]: [
          {
            group_type: "MEDIC",
          },
          {
            status: {
              [Op.notIn]: [WORKPLAN_STATUS.FINISH, WORKPLAN_STATUS.REJECTED],
            },
          },
          {
            [Op.or]: [
              Sequelize.literal(
                `STR_TO_DATE(tanggal_selesai, '%d-%m-%Y') <= '${today.format(
                  "YYYY-MM-DD"
                )}'`
              ),
            ],
          },
        ],
      },
    });

    const totalDueDataNonMedic = await WORKPLAN_DB.count({
      where: {
        [Op.and]: [
          {
            group_type: "NON_MEDIC",
          },
          {
            status: {
              [Op.notIn]: [WORKPLAN_STATUS.FINISH, WORKPLAN_STATUS.REJECTED],
            },
          },
          {
            [Op.or]: [
              Sequelize.literal(
                `STR_TO_DATE(tanggal_selesai, '%d-%m-%Y') <= '${today.format(
                  "YYYY-MM-DD"
                )}'`
              ),
            ],
          },
        ],
      },
    });

    // Send Notif to admin
    const adminSessions = await USER_SESSION_DB.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("fcmToken")), "fcmToken"],
      ],
      where: Sequelize.literal(`JSON_CONTAINS(kodeAkses, '"1200"')`),
    });

    const adminUserId = await USER_SESSION_DB.findAll({
      attributes: ["iduser"],
      where: Sequelize.literal(`JSON_CONTAINS(kodeAkses, '"1200"')`),
      raw: true,
    });

    const currentDate = moment().format("lll");
    const PID = `PID-${generateRandomNumber(1000, 9999)}`;

    if (adminUserId && adminUserId.length > 0) {
      const announcements = adminUserId.map((user) => ({
        pid: PID,
        title: "Work in Progress Due Date",
        message: `Tanggal: ${currentDate}\n\nAda ${totalDueDataMedic} work in progress medis dan ${totalDueDataNonMedic} non medis yang dibuat telah memasuki tanggal due date!`,
        receiver: user?.iduser,
        isRead: false,
        createdBy: "system",
      }));

      await PENGUMUMAN_DB.bulkCreate(announcements);
    }

    // ubah hasil ke array fcmToken
    const adminFcmTokens = adminSessions
      .filter((session) => !!session.fcmToken) // hanya yang memiliki fcmToken
      .map((session) => session.fcmToken);

    if (adminFcmTokens.length > 0) {
      console.log("Sending Notification Schedule to Admin");
      console.log("Admin token", adminFcmTokens);
      sendMulticastMessage(
        adminFcmTokens,
        {
          title: `Work in Progress Due Date`,
          body: `Ada ${totalDueDataMedic} work in progress medis dan ${totalDueDataNonMedic} non medis yang dibuat telah memasuki tanggal due date!`,
        },
        {
          name: "WorkplanStack",
          screen: "WorkplanListApproval",
          params: JSON.stringify({
            admin: "1",
          }),
        }
      );
    }
  } catch (error) {
    console.log("FAILED TO GET LIST", error);
  }
};

// -- Get WP Attachment
exports.get_workplan_attachment = async (req, res) => {
  const { authorization } = req.headers;
  const { wp_id } = req.params;
  try {
    const data = await WORKPLAN_ATTACHMENT.findAll({
      where: {
        workplan_id: wp_id,
      },
    });

    Responder(res, "OK", null, data, 200);
    return;
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};
