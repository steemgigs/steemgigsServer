const steem = require('steem')

const checkUsername = async (req, res, next) => {
    try {
        steem.api.getAccounts([req.params.username], function(err, result) {
            if (result.length !== 0) {
                next()
            } else {
                res.send([])
            }
        })
    } catch {
        res.status(500).send()
    }
}

module.exports = checkUsername