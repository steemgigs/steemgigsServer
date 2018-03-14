const {steemDataDB} = require('../DBconn')
const { Schema } = require('mongoose')

module.exports = steemDataDB.model('Account', new Schema({}), 'Accounts')
