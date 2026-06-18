const express = require('express');
const router = express.Router();
const { generatePDF, generateExcel } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/pdf', protect, authorize('admin', 'officer'), generatePDF);
router.get('/excel', protect, authorize('admin', 'officer'), generateExcel);

module.exports = router;
