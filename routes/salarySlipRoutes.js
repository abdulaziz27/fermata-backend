const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getAllSalarySlips,
  getTeacherSalarySlip,
} = require("../controllers/salarySlipController");

// router.post("/", protect, admin, generateSalarySlip);
router.get("/", protect, admin, getAllSalarySlips);
// router.put("/:id", protect, admin, updateSalarySlip);
// router.delete("/:id", protect, admin, deleteSalarySlip);
router.get("/:teacherId/:month/:year", protect, getTeacherSalarySlip);

module.exports = router;