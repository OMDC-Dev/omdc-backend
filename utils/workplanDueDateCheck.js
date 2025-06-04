const cron = require("node-cron");
const workplan = require("../controllers/workplan/workplan.controller");

const runWorkplanDueDate = async () => {
  cron.schedule("* * * * *", () => {
    //workplan.get_workplan_schedule();
  });
};

module.exports = {
  runWorkplanDueDate,
};
