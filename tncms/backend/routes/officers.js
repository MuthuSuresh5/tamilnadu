const express = require('express');
const router = express.Router();
const { createOfficer, getOfficers, getOfficer, updateOfficer, deleteOfficer, resetOfficerPassword, getOfficerPerformance } = require('../controllers/officerController');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfilePhoto } = require('../config/cloudinary');

router.get('/performance', protect, authorize('admin', 'superadmin'), getOfficerPerformance);
router.get('/', protect, authorize('admin', 'superadmin'), getOfficers);
router.post('/', protect, authorize('admin', 'superadmin'), uploadProfilePhoto, createOfficer);
router.get('/:id', protect, authorize('admin', 'superadmin'), getOfficer);
router.put('/:id', protect, authorize('admin', 'superadmin'), uploadProfilePhoto, updateOfficer);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteOfficer);
router.put('/:id/reset-password', protect, authorize('admin', 'superadmin'), resetOfficerPassword);

module.exports = router;
