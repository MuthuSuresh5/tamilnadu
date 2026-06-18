const express = require('express');
const router = express.Router();
const { createOfficer, getOfficers, getOfficer, updateOfficer, deleteOfficer, resetOfficerPassword, getOfficerPerformance } = require('../controllers/officerController');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfilePhoto } = require('../config/cloudinary');

router.get('/performance', protect, authorize('admin'), getOfficerPerformance);
router.get('/', protect, authorize('admin'), getOfficers);
router.post('/', protect, authorize('admin'), uploadProfilePhoto, createOfficer);
router.get('/:id', protect, authorize('admin'), getOfficer);
router.put('/:id', protect, authorize('admin'), uploadProfilePhoto, updateOfficer);
router.delete('/:id', protect, authorize('admin'), deleteOfficer);
router.put('/:id/reset-password', protect, authorize('admin'), resetOfficerPassword);

module.exports = router;
