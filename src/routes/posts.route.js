const express = require('express')
const router = express.Router()

// Middleware

const checkSteemConnect = require('../middleware/check-steemconnect')
const checkPermlink = require('../middleware/check-permlink')

// Controller

const postController = require('../controllers/post.controller')

// Routes

router.post('/post', checkSteemConnect, checkPermlink, postController.create_post)
router.post('/comment', checkSteemConnect, postController.create_comment)
router.get('/comments/:username/:permlink', postController.get_comments)
router.get('/comment/:username/:permlink', postController.get_comment)
router.get('/steemgig/:author/:permlink/:viewer?', postController.get_post)
router.get('/featured', postController.get_featured)
router.get('/usergigs/:author', postController.user_gigs)
router.get('/steemgigs/:type?/:limit?/:page?/:last_id?', postController.get_steemGigs)
router.get('/steembycat/:category', postController.getByCategory)
router.get('/steembysubcat/:subcategory', postController.getBySubCategory)

// Export

module.exports = router
