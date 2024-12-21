const SalarySlip = require("../models/salarySlipModel");
const StudentPackage = require("../models/studentPackageModel");

// Get all salary slips (Admin only)
const getAllSalarySlips = async (req, res) => {
  try {
    const salarySlips = await SalarySlip.find().populate("teacher_id", "name");
    res.status(200).json({
      success: true,
      data: salarySlips,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get teacher's salary slip (Teacher and Admin)
const getTeacherSalarySlip = async (req, res) => {
  try {
    const { teacherId, month, year } = req.params;
    const salarySlip = await SalarySlip.findOne({
      teacher_id: teacherId,
      month: parseInt(month),
      year: parseInt(year),
    }).populate("teacher_id", "name");

    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: "Salary slip not found",
      });
    }

    res.status(200).json({
      success: true,
      data: salarySlip,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update or create salary slip (called when a schedule is created or updated)
const updateSalarySlip = async (
  teacherId,
  schedule,
  studentName,
  instrument
) => {
  const month = schedule.date.getMonth() + 1;
  const year = schedule.date.getFullYear();

  let salarySlip = await SalarySlip.findOne({
    teacher_id: teacherId,
    month,
    year,
  });

  if (!salarySlip) {
    salarySlip = new SalarySlip({
      teacher_id: teacherId,
      month,
      year,
      total_salary: 0,
      details: [],
    });
  }

  const totalFee = schedule.teacher_fee + schedule.transport_fee;

  // Check if the detail already exists
  const existingDetailIndex = salarySlip.details.findIndex(
    (detail) => detail.date.toISOString() === schedule.date.toISOString()
  );

  if (existingDetailIndex !== -1) {
    // Update existing detail
    salarySlip.details[existingDetailIndex] = {
      student_name: studentName,
      instrument,
      date: schedule.date,
      room: schedule.room,
      attendance_status: schedule.attendance_status,
      note: schedule.note,
      fee_class: schedule.teacher_fee,
      fee_transport: schedule.transport_fee,
      total_fee: totalFee,
    };
  } else {
    // Add new detail
    salarySlip.details.push({
      student_name: studentName,
      instrument,
      date: schedule.date,
      room: schedule.room,
      attendance_status: schedule.attendance_status,
      note: schedule.note,
      fee_class: schedule.teacher_fee,
      fee_transport: schedule.transport_fee,
      total_fee: totalFee,
    });
  }

  // Recalculate total_salary
  salarySlip.total_salary = salarySlip.details.reduce((total, detail) => {
    return detail.attendance_status === "Success"
      ? total + detail.total_fee
      : total;
  }, 0);

  await salarySlip.save();
};

module.exports = {
  getAllSalarySlips,
  getTeacherSalarySlip,
  updateSalarySlip,
};
