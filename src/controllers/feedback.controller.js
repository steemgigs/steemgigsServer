const Feedback = require('../model/feedback')
const {stringify} = require('../utils')

exports.add_feedback = (req, res) => {
  let {message, rating, email, username} = req.body
  console.log('got a new feedback!!!:::=>', {message, rating, email, username})
  let newFeedback
  (username.trim().length > 0) ? newFeedback = new Feedback({message, rating, email, username}) : newFeedback = new Feedback({message, rating, email})
  newFeedback.save().then((data) => {
    console.log(stringify(data))
    res.send('Saved successfully')
  }).catch((e) => {
    res.send(e)
  })
}
