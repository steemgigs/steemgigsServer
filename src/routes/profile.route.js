const express = require('express')
const router = express.Router()
const validate = require('express-validation')
const { editProfile } = require('../validation/entries.validation'); 

// Middleware

const checkSteemConnect = require('../middleware/check-steemconnect')
const checkUlogCertfied = require('../middleware/certified-ulogger')
const checkUser = require('../middleware/check-user')

// Controller

const profileController = require('../controllers/profile.controller')

// Routes

router.post('/loggedIn', checkSteemConnect, profileController.login)
router.post('/profile', profileController.set_profile)
router.post('/editProfile', validate(editProfile), checkSteemConnect, checkUser, profileController.edit_profile)
router.post('/verify', profileController.verify_user)
router.get('/profile/:username', checkUlogCertfied, profileController.get_profile)
router.get('/userImage/:username', profileController.get_user_image)
router.get('/:account/*.json', profileController.get_account)

// Export

module.exports = router
