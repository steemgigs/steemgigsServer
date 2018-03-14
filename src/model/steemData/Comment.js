const {steemDataDB} = require('../DBconn')
const { Schema } = require('mongoose')

module.exports = steemDataDB.model('Comment', new Schema({}), 'Comments')
