exports.validatePDF = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: "File wajib diunggah!" });
    }

    // Cek ekstensi file
    const fileExtension = req.file.mimetype;
    if (fileExtension !== 'application/pdf') {
        return res.status(400).json({ message: "Format file harus PDF!" });
    }

    next(); // Jika aman, lanjut ke controller
};