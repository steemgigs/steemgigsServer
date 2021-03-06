const Post = require('../model/post')
const User = require('../model/user')
const {calcRep} = require('../utils')
const steem = require('steem')

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

  let matchOptions = {$match: {}}

  if (type) {
    matchOptions.$match['type'] = type
  }

  if (minPrice && maxPrice) {
    matchOptions.$match['price'] = { $lte: maxPrice, $gte: minPrice }
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
        const getBlockchainData = new Promise(function (resolve, reject) {
          let combinedResults = []
          const searchData = result[0].search_data
          if (searchData.length !== 0) {
            searchData.forEach(singleResult => {
              const dbData = singleResult
              steem.api.getContent(singleResult.author, singleResult.permlink, function (err, post) {
                if (!err) {
                  post.json_metadata = JSON.parse(post.json_metadata)
                  post.rep = calcRep(post.author_reputation)
                  const mergedResults = {...dbData, ...post}
                  combinedResults.push(mergedResults)
                  if (combinedResults.length === searchData.length) {
                    resolve(combinedResults)
                  }
                }
              })
            })
          } else {
            resolve([])
          }
        })
        getBlockchainData
          .then(function (results) {
            if (result[0].post_count[0]) {
              searchResult.pages = Math.ceil(result[0].post_count[0].count / limit)
            }
            searchResult.results = results
            res.status(200).send(searchResult)
          })
      }
    })
  } catch (err) {
    res.status(500)
    console.log(err)
  }
}

// Search Users

exports.search_users = (req, res) => {
  const getUsers = new Promise(function (resolve, reject) {
    const {searchText, pageNumber, order, limit} = req.body
    const skipCount = limit * (pageNumber - 1)
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
    }
    // Set pipeline, left in own array for easier optional fields in the future
    let pipeline = [
      {$match: {username: { $regex: searchText }}},
      {$match: {deleted: false}},
      {$match: {disabled: false}}
    ]
    // Add facet for search result data, pagination & user count
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
    // Search users table and gather data from steem blockchain about user
    User.aggregate(pipeline).exec((err, result) => {
      if (!err) {
        let pageCount = 0
        // If results calculate the number of pages
        if (result[0].post_count[0]) {
          pageCount = Math.ceil(result[0].post_count[0].count / limit)
        }
        let combinedResults = []
        result[0].search_data.forEach(singleUser => {
          steem.api.getAccounts([singleUser.username], function (err, steemUser) {
            if (!err) {
              singleUser.rep = calcRep(singleUser.username)
              const mergedResults = {...singleUser, ...steemUser[0]}
              combinedResults.push(mergedResults)
            } else {
              reject(err)
            } if (combinedResults.length === result[0].search_data.length) {
              resolve({
                searchResults: combinedResults,
                pageCount: pageCount
              })
            }
          })
        })
      } else {
        reject(err)
      }
    })
  })
  // Upon promise being resolved, send list of users back to client
  getUsers
    .then(function (userList) {
      res.send(
        userList
      )
    }).catch(function (err) {
      console.log(err)
      res.status(500)
    })
}
