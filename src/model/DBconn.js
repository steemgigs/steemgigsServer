const mongoose = require('mongoose')

const config = require('../config')

mongoose.Promise = global.Promise
let DBconOpts = {
  useMongoClient: true,
  reconnectInterval: 1000
}
let steemgigsDB = mongoose.createConnection(process.env.DB_URI || config.steemgigsDB_url, DBconOpts)
let steemDataDB = mongoose.createConnection(process.env.steemDataDB_URI || config.steemDataDB_url, DBconOpts)

module.exports = {
  steemgigsDB,
  steemDataDB
}
