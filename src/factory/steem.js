const steem = require('steem')

steem.api.setOptions({ url: 'wss://steemd.privex.io' })

module.exports = steem
