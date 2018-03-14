const {steemgigsDB} = require('./DBconn')
const { Schema } = require('mongoose')

let postSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  permlink: {
    type: String,
    required: false,
    trim: true
  },
  url: {
    type: String,
    required: false,
    unique: true
  },
  category: {
    type: String,
    required: false
  },
  subcategory: {
    type: String,
    required: false
  },
  views: Array,
  price: String,
  type: String,
  currency: String,
  tags: [String],
  createdOn: {
    type: Date,
    required: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Number,
    required: false
  },
  last_login: {
    type: Number,
    required: false
  }
}, {runSettersOnQuery: true})

postSchema.pre('save', function (next) {
  console.log('pre save')
  var currentDate = new Date().getTime()
  this.updatedAt = currentDate
  if (!this.createdOn) {
    this.createdOn = currentDate
  }
  next()
})

var post = steemgigsDB.model('post', postSchema)

module.exports = post
