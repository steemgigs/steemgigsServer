const steem = require('steem')

const checkPermlink = async (req, res, next) => {
  let username = req.body.username
  let permlink = req.body.permlink
  // Check Steem for permlink
  steem.api.getContent(username, permlink, function (err, result) {
    if (!err) {
      if (permlink === result.permlink) {
        // Append random characters if permlink is found
        req.body.permlink = permlink + '-' + Math.random().toString(36).substring(7)
      }
      // Move to the next middleware
      return next()
    } else {
      // Send an error message in the response.
      res.status(500).send()
    }
  })
}

module.exports = checkPermlink
