const express = require('express')
const posts = require('./routes/posts.route.js')
const profile = require('./routes/profile.route.js')
const search = require('./routes/search.route.js')
const image = require('./routes/images.route.js')
const feedback = require('./routes/feedback.route.js')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const logger = require('morgan')
const cors = require('cors')
const config = require('./config')
const app = express()

require('dotenv').config()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(logger('dev'))
app.use(helmet())
app.disable('x-powered-by')
app.set('tokenSecret', process.env.TOKEN_SECRET || config.token_secret)

// Routes

app.use('/posts', posts)
app.use('/profile', profile)
app.use('/feedback', feedback)
app.use('/search', search)
app.use('/images', image)

// Listener

var listener = app.listen(process.env.PORT || 5000, function () {
  console.log('Listening on port ' + listener.address().port)
})
