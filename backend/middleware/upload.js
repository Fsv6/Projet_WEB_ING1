// backend/middleware/upload.js
const multer = require('multer')
const path = require('path')

// Configuration du stockage en mémoire
const storage = multer.memoryStorage();

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true)
    } else {
        cb(new Error('Seuls les fichiers .png et .jpeg sont autorisés'), false)
    }
}

const upload = multer({ storage, fileFilter })
module.exports = upload
