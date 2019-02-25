const Post = require('../model/post')
const {handleErr} = require('../utils')

exports.search = (req, res) => {
  const {searchText, type, category, subcategory, currency, minPrice, maxPrice, pageNumber, order, limit} = req.body.query
  const skipCount = limit * (pageNumber - 1)
  let searchResult = {}
  let sortMethod = {}
  // Set sort method based on request
  switch (order.toLowerCase()) {
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
    case 'price_low':
      sortMethod = {
        price: 1
      }
      break
    case 'price_high':
      sortMethod = {
        price: -1
      }
      break
  }

  // Define pipeline based on request provided parameters

  let pipeline = []

  if (searchText) {
    pipeline = pipeline.concat(
      {$match: {$text: {$search: searchText.trim()}}},
      {$addFields: {score: {$meta: 'textScore'}}}
    )
  }

  let matchOptions = {$match: {
    price: { $lte: maxPrice, $gte: minPrice }
  }}

  if (type) {
    matchOptions.$match['type'] = type
  }

  if (currency && currency.toLowerCase() !== 'any') {
    matchOptions.$match['currency'] = currency
  }

  if (category && category.toLowerCase() !== 'any') {
    matchOptions.$match['category'] = category
  }

  if (subcategory && subcategory.toLowerCase() !== 'any') {
    matchOptions.$match['subcategory'] = subcategory
  }

  pipeline.push(matchOptions)

  // Add facet for search result data, pagination & post count
  pipeline.push(
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
  )

  try {
    Post.aggregate(pipeline).exec((err, result) => {
      if (!err) {
        // Add results to search result object and calculate total number of pages available for client side UI
        searchResult.results = result[0].search_data
        if (result[0].post_count[0]) {
          searchResult.pages = Math.ceil(result[0].post_count[0].count / limit)
        }
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
