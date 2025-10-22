const express = require('express');
const User = require('../models/User');
const { auth, requireTeacher } = require('../middleware/auth');
const router = express.Router();

// Get all students for teacher (ONLY their own students)
router.get('/', auth, requireTeacher, async (req, res) => {
  try {
    const students = await User.find({ 
      createdBy: req.user._id, // Only students created by this teacher
      role: 'student',
      isActive: true 
    }).select('-password');
    
    // Ensure subjects array exists for each student
    const studentsWithSubjects = students.map(student => ({
      ...student.toObject(),
      subjects: student.subjects || []
    }));
    
    res.json(studentsWithSubjects);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create student
router.post('/', auth, requireTeacher, async (req, res) => {
  try {
    const { name, email, password, subjects } = req.body;

    // Check if student already exists
    const existingStudent = await User.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    const student = new User({
      name,
      email,
      password,
      role: 'student',
      subjects: subjects || [],
      createdBy: req.user._id // Associate with creating teacher
    });

    await student.save();

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        subjects: student.subjects || []
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error while creating student' });
  }
});

// Update student subjects (only for teacher's own students)
router.put('/:id/subjects', auth, requireTeacher, async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      createdBy: req.user._id, // Only allow updating own students
      role: 'student'
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.subjects = req.body.subjects || [];
    await student.save();

    res.json({
      message: 'Student subjects updated successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        subjects: student.subjects || []
      }
    });
  } catch (error) {
    console.error('Update student subjects error:', error);
    res.status(500).json({ message: 'Server error while updating student subjects' });
  }
});

// Delete student (only teacher's own students)
router.delete('/:id', auth, requireTeacher, async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      createdBy: req.user._id, // Only allow deleting own students
      role: 'student'
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.isActive = false;
    await student.save();

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error while deleting student' });
  }
});

module.exports = router;