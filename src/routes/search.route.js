const express = require('express')
const router = express.Router()

// Controller

const searchController = require('../controllers/search.controller')

// Routes

router.post('/search_posts/', searchController.search)
router.post('/search_users/', searchController.search_users)

// Export

module.exports = router
