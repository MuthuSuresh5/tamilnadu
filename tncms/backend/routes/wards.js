const express = require('express');
const router = express.Router();
const { createWard, getWards, getWard, updateWard, deleteWard, assignOfficer, getWardStats } = require('../controllers/wardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getWards);
router.get('/stats/:wardNumber', getWardStats);
router.get('/:id', getWard);
router.post('/', protect, authorize('admin'), createWard);
router.put('/assign-officer', protect, authorize('admin'), assignOfficer);
router.put('/:id', protect, authorize('admin'), updateWard);
router.delete('/:id', protect, authorize('admin'), deleteWard);

module.exports = router;
