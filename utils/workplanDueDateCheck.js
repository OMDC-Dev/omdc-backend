const cron = require("node-cron");
const workplan = require("../controllers/workplan/workplan.controller");

const db = require("../db/user.db");
const REPORT_DB = db.scheduler_report;

const runWorkplanDueDate = () => {
  cron.schedule("0 8 * * *", async () => {
    //"0 8 * * *"
    try {
      await workplan.get_workplan_schedule();
      await REPORT_DB.create({
        is_sent: true,
      });
      console.log("Workplan and report inserted successfully at 08:00");
    } catch (e) {
      console.error("Cron job failed:", e);
    }
  });

  // Hanya dijalankan sekali saat init
  console.log("Cron job scheduled for 08:00 daily");
};

module.exports = {
  runWorkplanDueDate,
};
