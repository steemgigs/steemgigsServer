const express = require('express')
const router = express.Router()

// Controller

const imageController = require('../controllers/images.controller')

// Routes

router.post('/imgUpload', imageController.upload_image)

// Export

module.exports = router
