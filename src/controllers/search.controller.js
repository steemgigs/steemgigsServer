const Post = require('../model/post')
const {handleErr} = require('../utils')

exports.search = (req, res) => {
  const {query} = req.body
  const limit = req.params.limit || 50
  let searchResult = []
  try {
    var {searchText} = query
    Post.find({type: 'steemgigs_post', $text: {$search: searchText.trim()}}, { score: {$meta: 'textScore'} }).select('').limit(limit).exec((err, result) => {
      if (!err) {
        searchResult = result
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
