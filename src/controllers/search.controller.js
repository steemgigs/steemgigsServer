const Post = require('../model/post')
const {handleErr} = require('../utils')

exports.search = (req, res) => {
  const {searchText, type, currency, pageNumber, limit} = req.body.query
  const skipCount = pageNumber * limit
  let searchResult = {}
  try {
    Post.aggregate([
      { $match: {$text: {$search: searchText.trim()}} },
      { $addFields: {score: {$meta: 'textScore'}} },
      { '$facet': {
        'search_data': [
          {'$match': {type: type}},
          {'$match': {currency: currency}},
          {'$skip': skipCount},
          {'$limit': limit}
        ],
        'post_count': [
          {'$match': {type: type}},
          {'$match': {currency: currency}},
          { $count: 'count' }
        ]
      }}
    ]).exec((err, result) => {
      if (!err) {
        // Add results to search result object and calculate total number of pages available for client side UI
        searchResult.results = result[0].search_data
        searchResult.pages = result[0].post_count[0].count / limit
      } else {
        handleErr(err, res, 'empty result')
      }
      res.status(200).send(searchResult)
    })
  } catch (err) {
    res.status(500)
    console.log(err)
  }
}
