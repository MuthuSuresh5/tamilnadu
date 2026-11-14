const express = require('express');
const router = express.Router();
const { createWard, getWards, getWard, updateWard, deleteWard, assignOfficer, getWardStats } = require('../controllers/wardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getWards);
router.get('/stats/:wardNumber', getWardStats);
router.get('/:id', getWard);
router.post('/', protect, authorize('admin', 'superadmin'), createWard);
router.put('/assign-officer', protect, authorize('admin', 'superadmin'), assignOfficer);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateWard);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteWard);

module.exports = router;
