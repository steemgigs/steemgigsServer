const {steemDataDB} = require('../DBconn')
const { Schema } = require('mongoose')

module.exports = steemDataDB.model('Post', new Schema({}), 'Posts')
