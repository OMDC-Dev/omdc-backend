const cron = require("node-cron");
const workplan = require("../controllers/workplan/workplan.controller");

const db = require("../db/user.db");
const REPORT_DB = db.scheduler_report;

const runWorkplanDueDate = async () => {
  cron.schedule("0 8 * * *", () => {
    workplan.get_workplan_schedule();
  });
  // cron.schedule("*/3 * * * *", () => {
  //   workplan.get_workplan_schedule();
  // });

  REPORT_DB.create({
    is_sent: true,
  });
};

module.exports = {
  runWorkplanDueDate,
};
