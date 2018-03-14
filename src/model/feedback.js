const {steemgigsDB} = require('./DBconn')
const { Schema } = require('mongoose')

let feedbackSchema = new Schema({
  username: {
    type: String,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: false,
    trim: true
  },
  rating: {
    type: Number,
    required: true
  },
  feedback: String,
  message: String,
  currentDate: Date,
  updatedAt: Date
}, {runSettersOnQuery: true})

feedbackSchema.pre('save', function (next) {
  var currentDate = new Date().getTime()
  this.updatedAt = currentDate
  if (!this.createdOn) {
    this.createdOn = currentDate
  }
  next()
})

var feedback = steemgigsDB.model('feedback', feedbackSchema)

module.exports = feedback
