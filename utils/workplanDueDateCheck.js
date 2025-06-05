const cron = require("node-cron");
const workplan = require("../controllers/workplan/workplan.controller");

const runWorkplanDueDate = async () => {
  // cron.schedule("0 8 * * *", () => {
  //   workplan.get_workplan_schedule();
  // });
  cron.schedule("*/3 * * * *", () => {
    workplan.get_workplan_schedule();
  });
};

module.exports = {
  runWorkplanDueDate,
};
