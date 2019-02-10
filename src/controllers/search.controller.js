const Post = require('../model/post')
const {handleErr} = require('../utils')

exports.search = (req, res) => {
  const {searchText, type, currency, minPrice, maxPrice, pageNumber, limit} = req.body.query
  const skipCount = limit * (pageNumber - 1)
  let searchResult = {}
  try {
    Post.aggregate([
      {$match: {$text: {$search: searchText.trim()}}},
      {$match: {type: type, currency: currency}},
      {$addFields: {score: {$meta: 'textScore'}}},
      { '$facet': {
        'search_data': [
          {'$skip': skipCount},
          {'$limit': limit}
        ],
        'post_count': [
          { $count: 'count' }
        ]
      }}
    ]).exec((err, result) => {
      if (!err) {
        // Add results to search result object and calculate total number of pages available for client side UI
        searchResult.results = result[0].search_data
        searchResult.pages = Math.ceil(result[0].post_count[0].count / limit)
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
