const express = require('express');
const router = express.Router();
const {
  submitComplaint, trackComplaint, getMyComplaints,
  getAllComplaints, updateComplaintStatus, deleteComplaint, getCompletedFeed,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const { uploadComplaintImages, uploadCompletionPhotos } = require('../config/cloudinary');

router.get('/feed', getCompletedFeed);
router.get('/track/:id', trackComplaint);
router.post('/', uploadComplaintImages, submitComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/', protect, authorize('officer', 'admin', 'superadmin'), getAllComplaints);
router.put('/:id/status', protect, authorize('officer', 'admin', 'superadmin'), uploadCompletionPhotos, updateComplaintStatus);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteComplaint);

module.exports = router;
