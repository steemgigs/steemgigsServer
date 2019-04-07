const steem = require('steem')

const checkUsername = async (req, res, next) => {
  try {
    steem.api.getAccounts([req.params.username], function (err, result) {
      if (result.length !== 0) {
        next()
      } else {
        console.log(err)
        res.send([])
      }
    })
  } catch (err) {
    res.status(500).send()
  }
}

module.exports = checkUsername
