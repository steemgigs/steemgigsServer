const axios = require('axios')
const {handleErr, stringify} = require('../utils.js')

const validateSteemconnect = async (req, res, next) => {
  let token = req.headers['token'] || req.headers['x-access-token'] || req.body.token
  if (token) {
    axios.get(`https://steemconnect.com/api/me?access_token=${token}`).then(response => {
      let responseData = response.data
      if (responseData.user === responseData._id) {
        req.user = responseData.user
        req.token = token
        next()
      } else {
        console.log(responseData)
        res.send('stop there!')
      }
    }).catch(err => {
      if (err.response) {
        console.log(stringify(err.response.data))
        if (err.response.data.error) {
          handleErr(err.response.data, res, err.response.data.error, 401)
        } else {
          handleErr(err.response.data, res, 'verification error', 403)
        }
      } else {
        handleErr(err, res, 'verification server is unreachable')
      }
    })
  } else {
    handleErr({}, res, 'You are not authroized!', 403)
  }
}

module.exports = validateSteemconnect
