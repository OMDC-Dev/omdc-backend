module.exports = (sequelize, Sequelize) => {
  const Workplan = sequelize.define(
    "workplan",
    {
      workplan_id: {
        type: Sequelize.STRING,
      },
      jenis_workplan: {
        type: Sequelize.STRING,
      },
      tanggal_mulai: {
        type: Sequelize.STRING,
      },
      tanggal_selesai: {
        type: Sequelize.STRING,
      },
      kd_induk: {
        type: Sequelize.STRING,
      },
      perihal: {
        type: Sequelize.STRING,
      },
      kategori: {
        type: Sequelize.STRING,
      },
      iduser: {
        type: Sequelize.STRING,
      },
      user_cc: {
        type: Sequelize.JSON,
      },
      attachment_before: {
        type: Sequelize.STRING,
      },
      attachment_after: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      approved_date: {
        type: Sequelize.STRING,
      },
      approved_by: {
        type: Sequelize.STRING,
      },
      revise_message: {
        type: Sequelize.TEXT,
      },
    },
    {
      tableName: "omdc_workplan",
      underscore: true,
    }
  );

  Workplan.associate = (models) => {
    Workplan.belongsTo(models.ruser, {
      foreignKey: "iduser",
      as: "user_detail",
    });

    Workplan.belongsTo(models.cabang, {
      foreignKey: "kd_induk",
      as: "cabang_detail",
    });

    Workplan.hasMany(models.workplan_date_history, {
      foreignKey: "wp_id",
      as: "workplant_date_history",
    });

    Workplan.hasMany(models.workplan_comment, {
      foreignKey: "wp_id",
      as: "workplant_comment",
    });
  };

  return Workplan;
};
