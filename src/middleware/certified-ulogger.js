const steem = require('steem')

const certifiedUlogger = async (req, res, next) => {
  const follower = 'uloggers'
  const followType = 'blog'
  const username = req.params.username
  const limit = 1000
  let startFollowing = 0
  let followingList = []
  let resultCount = 0

  try {
    do {
      await steem.api.getFollowingAsync(follower, startFollowing, followType, limit)
        .then(function (result) {
          // Set temporary list of followers from the result
          let tempFollowingList = result.map(result => result.following)
          // Set result count to the length of followers returned to compare against limit
          resultCount = tempFollowingList.length
          // Set new starting follower
          startFollowing = tempFollowingList.slice(-1)[0]
          // Push the temporary following List into the global following list
          followingList = followingList.concat(tempFollowingList)
        }).catch(console.error)
    } while (resultCount === limit)
    // Remove duplicate items in array
    followingList = Array.from(new Set(followingList))
    // Init local variable with Ulogger status
    res.locals.certifiedUloggerStatus = followingList.includes(username)
  } catch (err) {
    res.locals.certifiedUloggerStatus = false
  }
  // Move to the next middleware
  return next()
}
module.exports = certifiedUlogger
