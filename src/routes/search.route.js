const express = require('express')
const router = express.Router()

// Controller

const searchController = require('../controllers/search.controller')

// Routes

router.post('/search_posts/:limit?', searchController.search)

// Export

module.exports = router
