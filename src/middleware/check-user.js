const User = require('../model/user')

const userExist = async (req, res, next) => {
  try {
    // Check database for user from SteemConnect access token
    const user = await User.findOne({ user: req.body.username })

    // If the username is the same as the one from locals, pass to next middleware.
    if (user) {
      // Move to the next middleware
      return next()
    }

    // If it doesn't exist, create a new user object with the required data.
    const newUser = await new User({
      user: res.locals.username
    })
    newUser.save(function (error) {
      if (error) {
        console.log(error)
      }
      return next()
    })
  // Catch any possible error.
  } catch (err) {
    // Catch errors here.
    return next
  }
}

module.exports = userExist
