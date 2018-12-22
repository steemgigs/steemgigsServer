const cluster = require('cluster')
const express = require('express')

const CPUs = require('os')
  .cpus()
  .length

if (cluster.isMaster) {
  console.log(`Master cluster setting up ${CPUs} workers...`)

  for (var i = 0; i < CPUs; i++) {
    cluster.fork()
  }
  cluster.on('online', worker => {
    console.log(`Worker ${worker.process.pid} is online.`)
  })
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`)

    console.log('Starting a new worker')
    cluster.fork()
  })
} else {
  require('dotenv').config()
  // const fs = require('fs')
  // const https = require('https')
  const http = require('http')
  // const path = require('path')
  const bodyParser = require('body-parser')
  const helmet = require('helmet')
  const logger = require('morgan')
  const cors = require('cors')

  const app = express()

  const api = require('./api/index')
  const config = require('./config')

  const PORT = process.env.PORT || config.PORT
  // const S_PORT = process.env.S_PORT || config.S_PORT

  app
    .set('tokenSecret', process.env.TOKEN_SECRET || config.token_secret)
    .use(logger('dev'))
    .use(helmet())
    .disable('x-powered-by')
    .use(cors())
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))

  app.use('/api', api)
  app.use('/', api)

  app.get('/', (req, res) => {
    console.log(`process pid:${process.pid} recvd a request. at '/'`)
    res.send(`<h1>Hey!, I'm only designated to serve <a href="https://steemgigs.org">steemgigs.org</a> alone. Thanks you</h1>`)
  })

  // const secureServerOptions = {
  //   key: fs.readFileSync(path.resolve('./src/cert/private.key')),
  //   cert: fs.readFileSync(path.resolve('./src/cert/certificate.crt')),
  //   ca: fs.readFileSync(path.resolve('./src/cert/ca_bundle.pem')),
  //   requestCert: true,
  //   rejectUnauthorized: false
  // }

  // const secureServer = https.createServer(secureServerOptions, app)
  const server = http.createServer(app)

  // secureServer.listen(S_PORT)
  server.listen(PORT, () => {
    console.log(`Server(${process.pid}) running on PORT:${PORT} is listening to all requests`)
//   })
//   server.listen(PORT + 1, () => {
//     console.log(`Server(${process.pid}) running on PORT:${PORT + 1} is listening to all requests`)
//   })
//   server.listen(PORT + 2, () => {
//     console.log(`Server(${process.pid}) running on PORT:${PORT + 2} is listening to all requests`)
//   })
//   server.listen(PORT + 3, () => {
//     console.log(`Server(${process.pid}) running on PORT:${PORT + 3} is listening to all requests`)
//   })
}
