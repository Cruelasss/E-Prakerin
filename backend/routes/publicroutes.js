const express = require('express');
const { validatePDF } = require('../middleware/uploadValidator');
const router = express.Router();
const pendaftarController = require('../controllers/pendaftarController');
const multer = require('multer');

// Setting upload khusus di sini
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/daftar', upload.single('berkas'), pendaftarController.submitPendaftaran);
router.post('/daftar', upload.single('berkas'), validatePDF, pendaftarController.submitPendaftaran);

module.exports = router;