const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// TAMBAHKAN LINE INI UNTUK IMPORT MIDDLEWARE-NYA
const { protectAdmin } = require('../middleware/authMiddleware');

// Gunakan middleware tersebut
router.use(protectAdmin);

router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/peserta', adminController.getAllPeserta);
router.patch('/approve/:id', adminController.singleClickApproval);

module.exports = router;