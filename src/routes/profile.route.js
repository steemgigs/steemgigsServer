const express = require('express')
const router = express.Router()

// Middleware

const checkSteemConnect = require('../middleware/check-steemconnect')
const checkUlogCertfied = require('../middleware/certified-ulogger')

// Controller

const profileController = require('../controllers/profile.controller')

// Routes

router.post('/loggedIn', checkSteemConnect, profileController.login)
router.post('/profile', profileController.set_profile)
router.post('/editProfile', checkSteemConnect, profileController.edit_profile)
router.post('/verify', profileController.verify_user)
router.get('/profile/:username', checkUlogCertfied, profileController.get_profile)
router.get('/userImage/:username', profileController.get_user_image)
router.get('/:account/*.json', profileController.get_account)
router.get('/wallet/:username', profileController.get_wallet)
router.get('/transactions/:username', profileController.get_transactions)

// Export

module.exports = router
