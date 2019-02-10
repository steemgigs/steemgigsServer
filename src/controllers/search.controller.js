const Post = require('../model/post')
const {handleErr} = require('../utils')

exports.search = (req, res) => {
  const {searchText, type, category, subcategory, currency, minPrice, maxPrice, pageNumber, order, limit} = req.body.query
  const skipCount = limit * (pageNumber - 1)
  let searchResult = {}
  let sortMethod = {}

  switch (order) {
    case 'oldest':
      sortMethod = {
        _id: 1
      }
      break
    case 'newest':
      sortMethod = {
        _id: -1
      }
      break
    case 'priceLow':
      sortMethod = {
        price: 1
      }
      break
    case 'priceHigh':
      sortMethod = {
        price: -1
      }
      break
  }

  try {
    Post.aggregate([
      {$match: {$text: {$search: searchText.trim()}}},
      {$match: {type: type, currency: currency, price: { $lte: maxPrice, $gte: minPrice }, category: category, subcategory: subcategory}},
      {$addFields: {score: {$meta: 'textScore'}}},
      { '$facet': {
        'search_data': [
          {'$sort': sortMethod},
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
