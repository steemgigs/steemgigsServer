const router = require('express').Router()
const axios = require('axios')
const {stringify, handleErr} = require('../utils')

router.post('/verify', (req, res) => {
  let {token} = req.body
  if (token) {
    axios.get(`https://steemconnect.com/api/me?access_token=${token}`).then(response => {
      let responseData = response.data
      // console.log((responseData))
      res.send(responseData)
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
    handleErr(null, res, 'please supply a token', 401)
  }
})

module.exports = router
