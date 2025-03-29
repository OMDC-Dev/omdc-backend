module.exports = (sequelize, Sequelize) => {
  const Pengumuman = sequelize.define(
    "omdc_pengumuman",
    {
      pid: {
        type: Sequelize.STRING,
      },
      title: {
        type: Sequelize.STRING,
      },
      message: {
        type: Sequelize.TEXT,
      },
      receiver: {
        type: Sequelize.STRING,
      },
      createdBy: {
        type: Sequelize.STRING,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
      },
    },
    {
      tableName: "omdc_pengumuman",
    }
  );

  return Pengumuman;
};
