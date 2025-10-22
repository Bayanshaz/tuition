const express = require('express');
const LiveSession = require('../models/LiveSession');
const User = require('../models/User');
const { auth, requireTeacher } = require('../middleware/auth');
const router = express.Router();

// Get live sessions based on user role
router.get('/', auth, async (req, res) => {
  try {
    let liveSessions;
    
    if (req.user.role === 'teacher') {
      // Teachers see only their own live sessions
      liveSessions = await LiveSession.find({ 
        createdBy: req.user._id,
        isActive: true 
      }).populate('createdBy', 'name email').sort({ scheduledAt: 1 });
    } else {
      // Students see ALL active live sessions for their subjects (both upcoming and past)
      const studentSubjects = req.user.subjects || [];
      liveSessions = await LiveSession.find({ 
        subject: { $in: studentSubjects },
        isActive: true 
      }).populate('createdBy', 'name email').sort({ scheduledAt: 1 });
    }

    res.json(liveSessions);
  } catch (error) {
    console.error('Get live sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create live session (teacher only)
router.post('/', auth, requireTeacher, async (req, res) => {
  try {
    const { title, meetLink, subject, scheduledAt, description } = req.body;

    const liveSession = new LiveSession({
      title,
      meetLink,
      subject,
      scheduledAt,
      description,
      createdBy: req.user._id
    });

    await liveSession.save();
    await liveSession.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Live session scheduled successfully',
      liveSession
    });
  } catch (error) {
    console.error('Create live session error:', error);
    res.status(500).json({ message: 'Server error while scheduling live session' });
  }
});

// Delete live session (teacher only - only their own sessions)
router.delete('/:id', auth, requireTeacher, async (req, res) => {
  try {
    const liveSession = await LiveSession.findOne({
      _id: req.params.id,
      createdBy: req.user._id // Only allow deleting own sessions
    });

    if (!liveSession) {
      return res.status(404).json({ message: 'Live session not found' });
    }

    liveSession.isActive = false;
    await liveSession.save();

    res.json({ message: 'Live session deleted successfully' });
  } catch (error) {
    console.error('Delete live session error:', error);
    res.status(500).json({ message: 'Server error while deleting live session' });
  }
});

module.exports = router;