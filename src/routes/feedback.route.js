const express = require('express')
const router = express.Router()

// Controller

const feedbackController = require('../controllers/feedback.controller')

// Routes

router.post('/feedback', feedbackController.add_feedback)

// Export

module.exports = router
