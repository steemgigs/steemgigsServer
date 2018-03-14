const Joi = require('joi')
const {handleErr} = require('../utils')

const regSchema = {
  email: Joi.string().email().required(),
  firstname: Joi.string().min(3).max(30).required(),
  middlename: Joi.string(),
  lastname: Joi.string(),
  stagename: Joi.string(),
  profilePic: Joi.string(),
  address: Joi.string(),
  addressDetails: Joi.object(),
  social: Joi.object(),
  city: Joi.string().required(),
  surname: Joi.string(),
  gender: Joi.string(),
  country: Joi.string(),
  phone: Joi.string(),
  password: Joi.string().regex(
    new RegExp('[a-zA-Z0-9]{6,32}$')
  ).required()
}

module.exports = {
  login (req, res, next) {
    let data = req.body
    const {error} = Joi.validate(data, {
      userType: Joi.string().allow(['artist', 'member']),
      email: Joi.string().email().required(),
      password: Joi.string().regex(
        new RegExp('[a-zA-Z0-9]{6,32}$')
      ).required()
    })
    if (error) {
      console.log(JSON.stringify(error, null, 2))
      switch (error.details[0].context.key) {
        case 'login':
          handleErr({}, res, 'You must provide valid Username or email address', 400)
          break
        case 'password':
          if (data.password) {
            handleErr({}, res, 'You password can only contain Uppercase, lowercase & Numbers only and it must not be less than 5 characters', 400)
          } else {
            handleErr({}, res, 'You need a valid password to login', 400)
          }
          break
        default:
          handleErr({}, res, 'invalid login details', 400)
          break
      }
    } else {
      next()
    }
  },
  registerA (req, res, next) {
    let data = req.body
    // additional reg validations could be added
    const {error} = Joi.validate(data, regSchema)
    if (error) {
      console.log(JSON.stringify(error, null, 2))
      switch (error.details[0].context.key) {
        case 'email':
          handleErr({}, res, 'You must provide valid email address', 400)
          break
        case 'firstname':
          handleErr({}, res, 'Your firstname is required!', 400)
          break
        case 'city':
          handleErr({}, res, 'City is required!', 400)
          break
        case 'country':
          handleErr({}, res, 'Please supply your origin state', 400)
          break
        case 'password':
          if (error.details[0].type === 'string.regex.base') {
            handleErr({}, res, 'You password can only contain Uppercase, lowercase & Numbers only and it must not be less than 5 characters', 400)
          } else {
            handleErr({}, res, 'Password is required!', 400)
          }
          break
        default:
          handleErr({}, res, 'you need enough data to sign up', 400)
          break
      }
    } else {
      next()
    }
  },
  registerM (req, res, next) {
    let data = req.body
    // additional reg validations could be added
    const {error} = Joi.validate(data, regSchema)
    if (error) {
      console.log(JSON.stringify(error, null, 2))
      switch (error.details[0].context.key) {
        case 'email':
          handleErr({}, res, 'You must provide valid email address', 400)
          break
        case 'firstname':
          handleErr({}, res, 'Your firstname is required!', 400)
          break
        case 'city':
          handleErr({}, res, 'City is required!', 400)
          break
        case 'country':
          handleErr({}, res, 'Please supply your origin state', 400)
          break
        case 'password':
          if (error.details[0].type === 'string.regex.base') {
            handleErr({}, res, 'You password can only contain Uppercase, lowercase & Numbers only and it must not be less than 5 characters', 400)
          } else {
            handleErr({}, res, 'Password is required!', 400)
          }
          break
        default:
          res.status(400).send('you need enough data to sign up')

          break
      }
    } else {
      next()
    }
  }
}
