const axios = require('axios')
let api = axios.create({baseURL: `http://localhost:3000/`})

module.exports = {
  fetchSinglePost (username, permlink) {
    return api.post('/fetchSinglePost', {username, permlink})
  }
}
