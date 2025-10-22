const express = require('express');
const Video = require('../models/Video');
const User = require('../models/User');
const { auth, requireTeacher } = require('../middleware/auth');
const router = express.Router();

// Get videos based on user role
router.get('/', auth, async (req, res) => {
  try {
    let videos;
    
    if (req.user.role === 'teacher') {
      // Teachers see only their own uploaded videos
      videos = await Video.find({ 
        uploadedBy: req.user._id,
        isActive: true 
      }).populate('uploadedBy', 'name email');
    } else {
      // Students see ALL active videos for their subjects
      const studentSubjects = req.user.subjects || [];
      videos = await Video.find({ 
        subject: { $in: studentSubjects },
        isActive: true 
      }).populate('uploadedBy', 'name email');
    }

    res.json(videos);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create video (teacher only)
router.post('/', auth, requireTeacher, async (req, res) => {
  try {
    const { title, youtubeLink, subject, description } = req.body;

    const video = new Video({
      title,
      youtubeLink,
      subject,
      description,
      uploadedBy: req.user._id
    });

    await video.save();
    await video.populate('uploadedBy', 'name email');

    res.status(201).json({
      message: 'Video added successfully',
      video
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ message: 'Server error while adding video' });
  }
});

// Delete video (teacher only - only their own videos)
router.delete('/:id', auth, requireTeacher, async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id // Only allow deleting own videos
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.isActive = false;
    await video.save();

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error while deleting video' });
  }
});

module.exports = router;