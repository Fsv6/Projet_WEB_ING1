// backend/middleware/upload.js
const multer = require('multer')
const path = require('path')

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')  // Chemin relatif vers dossier "uploads"
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, Date.now() + '-' + file.fieldname + ext)
    }
})

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
