const StudentPackage = require("../models/studentPackageModel");
const User = require("../models/userModel");

// Create new student package (Admin only)
const createStudentPackage = async (req, res) => {
  try {
    const {
      student_id,
      package_id,
      payment_status,
      payment_total,
      payment_date,
      date_periode,
      schedules,
    } = req.body;

    // Validatte payment_status
    if (!["Belum Lunas", "Lunas", "Dibatalkan"].includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    // Validate student exists and is a student
    const studentUser = await User.findOne({
      _id: student_id,
      "user_type.role": "student",
    });

    if (!studentUser) {
      return res.status(400).json({
        success: false,
        message: "Student not found or invalid user type",
      });
    }

    const studentPackage = await StudentPackage.create({
      student_id,
      package_id,
      payment_status,
      payment_total,
      payment_date,
      date_periode,
      schedules,
    });

    res.status(201).json({
      success: true,
      data: studentPackage,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all student packages (Admin only)
const getAllStudentPackages = async (req, res) => {
  try {
    const studentPackages = await StudentPackage.find()
      .populate("student_id", "name email phone")
      .populate("package_id", "name description duration price")
      .populate("schedules.teacher_id", "name");

    res.status(200).json({
      success: true,
      data: studentPackages,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get teacher schedules (Teacher only)
const getTeacherSchedules = async (req, res) => {
  try {
    const schedules = await StudentPackage.find({
      "schedules.teacher_id": req.user.id,
    })
      .populate("student_id", "name")
      .populate("package_id", "name description")
      .select("schedules");

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get student schedules (Student only)
const getStudentSchedules = async (req, res) => {
  try {
    const schedules = await StudentPackage.find({
      student_id: req.user.id,
    })
      .populate("schedules.teacher_id", "name")
      .populate("package_id", "name description")
      .select("schedules package_id");

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update attendance (Teacher only)
const updateAttendance = async (req, res) => {
  try {
    const { studentPackageId, scheduleId } = req.params;
    const { attendance_status, activity_photo, note } = req.body;

    if (
      !["Success", "Murid Izin", "Guru Izin", "Reschedule"].includes(
        attendance_status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status",
      });
    }

    const studentPackage = await StudentPackage.findById(studentPackageId);
    if (!studentPackage) {
      return res.status(404).json({
        success: false,
        message: "Student package not found",
      });
    }

    const schedule = studentPackage.schedules.id(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    if (schedule.teacher_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this schedule",
      });
    }

    schedule.attendance_status = attendance_status;
    schedule.activity_photo = activity_photo;
    schedule.note = note;

    await studentPackage.save();

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update schedule (Admin only)
const updateSchedule = async (req, res) => {
  try {
    const { studentPackageId, scheduleId } = req.params;
    const { teacher_id, date, time, transport_fee, teacher_fee, room } =
      req.body;

    const studentPackage = await StudentPackage.findOneAndUpdate(
      {
        _id: studentPackageId,
        "schedules._id": scheduleId,
      },
      {
        $set: {
          "schedules.$.teacher_id": teacher_id || undefined,
          "schedules.$.date": date || undefined,
          "schedules.$.time": time || undefined,
          "schedules.$.transport_fee": transport_fee || undefined,
          "schedules.$.teacher_fee": teacher_fee || undefined,
          "schedules.$.room": room || undefined,
        },
      },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    );

    if (!studentPackage) {
      return res.status(404).json({
        success: false,
        message: "Student package or schedule not found",
      });
    }

    res.status(200).json({
      success: true,
      data: studentPackage,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete student package (Admin only)
const deleteStudentPackage = async (req, res) => {
  try {
    const studentPackage = await StudentPackage.findById(
      req.params.studentPackageId
    );

    if (!studentPackage) {
      return res.status(404).json({
        success: false,
        message: "Student package not found",
      });
    }

    await studentPackage.deleteOne();

    res.status(200).json({
      success: true,
      message: "Student package deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete schedule (Admin only)
const deleteSchedule = async (req, res) => {
  try {
    const { studentPackageId, scheduleId } = req.params;

    const studentPackage = await StudentPackage.findById(studentPackageId);
    if (!studentPackage) {
      return res.status(404).json({
        success: false,
        message: "Student package not found",
      });
    }

    const scheduleIndex = studentPackage.schedules.findIndex(
      (schedule) => schedule._id.toString() === scheduleId
    );

    if (scheduleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    studentPackage.schedules.splice(scheduleIndex, 1);
    await studentPackage.save();

    res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createStudentPackage,
  getAllStudentPackages,
  getTeacherSchedules,
  getStudentSchedules,
  updateAttendance,
  updateSchedule,
  deleteStudentPackage,
  deleteSchedule,
};
