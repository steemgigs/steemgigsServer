const {steemgigsDB} = require('./DBconn')
const { Schema } = require('mongoose')
const {ObjectId} = Schema.Types

let userSchema = new Schema({
  name: {
    type: String,
    required: false,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  expertise: {
    type: String,
    required: false,
    trim: true
  },
  vacation: {
    type: Boolean,
    default: false
  },
  views: Array,
  about: String,
  profilePic: String,
  coverPic: String,
  // languages: [{name: String, proficiency: String}],
  languages: Array,
  deleted: {
    type: Boolean,
    default: false
  },
  social: {
    type: Object
  },
  metrics: {
    views: Number,
    followers: Number,
    gigs: Number
  },
  servicesUsed: [{
    type: ObjectId,
    ref: 'Services'
  }],
  location: {
    type: String,
    required: false
  },
  gender: {
    type: String,
    required: false
  },
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
  socialReach: {
    type: Number,
    required: false,
  },
  skillsAndHobbies: {
    type: Array,
    required: false,
  },
  portfolio: {
    type: Array,
    required: false,
  },
  learning: {
    type: Array,
    required: false,
  },
  helpWith: {
    type: Array,
    required: false,
  },
  last_login: {
    type: Number,
    required: false
  }
}, {runSettersOnQuery: true})

userSchema.pre('save', function (next) {
  // let hash = crypto
  //   .createHash('md5')
  //   .update(this.email)
  //   .digest('hex')
  // this.profilePic = `https://www.gravatar.com/avatar/${hash}`

  var currentDate = new Date().getTime()
  this.updatedAt = currentDate
  if (!this.createdOn) {
    this.createdOn = currentDate
  }
  next()
})

var user = steemgigsDB.model('user', userSchema)

module.exports = user
