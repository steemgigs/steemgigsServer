const router = require('express').Router()
const sc2 = require('../factory/sc2')
const steem = require('steem')
// const steem = require('../factory/steem')
// const api2 = require('../factory/axios')

const User = require('../model/user')
const Post = require('../model/post')
// const SteemPost = require('../model/steemData/Post')
const SteemAccount = require('../model/steemData/Account')
// const SteemComment = require('../model/steemData/Comment')

const { handleErr, stringify, calcRep } = require('../utils')

router.get('/profile/:username', (req, res) => {
  var username = req.params.username
  User.findOne({username}).exec((err, profile) => {
    if (!err) {
      if (profile) {
        profile = profile.toObject({getters: true})
      } else {
        profile = {}
      }
      if (profile.deleted) {
        res.json({tye: 'deleted user'})
      } else if (profile.disabled) {
        res.json({type: 'user disabled or banned'})
      } else {
        delete profile.deleted
        delete profile.disabled
        steem.api.getAccounts([username], function (err, authorArray) {
          let author = authorArray[0]
          if (!err) {
            if (Object.keys(profile).length < 1) {
              let apiProfile = {}
              if (JSON.parse(author.json_metadata).profile) {
                apiProfile = JSON.parse(author.json_metadata).profile
              }
              let {profile_image: profilePic, name, about, location, website, cover_image: coverPic, facebook, github, instagram, twitter, discord} = apiProfile
              profile = {
                username,
                social: {
                  website: website || '',
                  facebook: facebook || '',
                  github: github || '',
                  discord: discord || '',
                  twitter: twitter,
                  instagram: instagram
                },
                languages: []
              }
              profile.name = name || ''
              profile.profilePic = profilePic || ''
              profile.about = about || ''
              profile.location = location || ''
              profile.coverPic = coverPic || ''
              profile.name = name || ''
            }
            profile.balance = author.balance
            profile.rep = calcRep(author.reputation)
            if (author.witness_votes.indexOf('steemgigs') > -1) {
              profile.steemgigsWitness = true
            } else {
              profile.steemgigsWitness = false
            }
            res.json(profile)
          } else {
            console.log('error connecting to steem to fetch complete userData', stringify(err))
            res.json(profile)
          }
        })
      }
    }
  })
  // steem.api.getAccounts([account], (err, result) => {
  //   if (!err) {
  //     console.log('jalasem::', result[0])
  //     res.send(result[0])
  //   } else {
  //     console.log('err:', err)
  //     res.status(500).send('error getting user profile info')
  //   }
  // })
})
router.get('/comments/:username/:permlink', (req, res) => {
  let {username: parentAuthor, permlink: parentPermlink} = req.params
  steem.api.getContentReplies(parentAuthor, parentPermlink, function (err, results) {
    if (!err) {
      let dataToSend = []
      let sendIt = () => {
        if (dataToSend.length === results.length) {
          res.send(dataToSend)
        }
      }
      results.forEach(comment => {
        let {author} = comment
        steem.api.getAccounts([author], function (err, authorArray) {
          let author = authorArray[0]
          if (!err) {
            try {
              comment.rep = calcRep(comment.author_reputation)
              comment.userImg = JSON.parse(author.json_metadata).profile.profile_image
            } catch (e) {
              console.log({e, author})
            }
            dataToSend.push(comment)
            sendIt()
          }
        })
      })
      sendIt()
    } else {
      handleErr(err, res, 'error fetching comments')
    }
  })
})
router.get('/userImage/:username', (req, res) => {
  let {username} = req.params
  SteemAccount.findOne({'name': username}).exec((err, result) => {
    result = result.toObject({getters: true})
    if (!err) {
      let info = {}
      info.profileImage = result.json_metadata.profile.profile_image || 'https://via.placeholder.com/100x100'
      info.rep = result.rep
      res.send(info)
    } else {
      handleErr(err, res, 'user doesnt exit')
    }
  })
})
router.get('/comment/:username/:permlink', (req, res) => {
  let {username: author, permlink} = req.params
  steem.api.getContentReplies(author, permlink, function (err, comment) {
    if (!err) {
      res.send(comment)
    } else {
      handleErr(err, res, 'error fetching comments')
    }
  })
})
router.get('/steemgig/:author/:permlink/:viewer', (req, res) => {
  let {author, permlink, viewer} = req.params
  if (viewer) {
    User.findOneAndUpdate({username: viewer}, {
      $addToSet: { views: {author, permlink} }
    }, {new: true}).then((response) => {
      console.log('viewed', {response})
    }).catch((e) => {
      console.log('viewed', {e})
    })
  }
  viewer = viewer ? { type: 'user', username: viewer, id: Math.floor(Math.random() * 1000) } : {type: 'guest', id: Math.floor(Math.random() * 1000)}
  steem.api.getContent(author, permlink, function (err, post) {
    if (!err) {
      try {
        post.rep = calcRep(post.author_reputation)
        post.json_metadata = JSON.parse(post.json_metadata)
        User.findOne({username: author}).exec((err, profile) => {
          if (!err && profile) {
            if (profile.profilePic) {
              post.json_metadata.authorPic = profile.profilePic
            }
          }
        })
      } catch (e) {
        console.log({e, post})
      }
      // updateview
      console.log(viewer)
      Post.findOneAndUpdate({author, permlink}, {
        $addToSet: { views: viewer }
      }, {new: true}).then((response) => {
        post.views = response.views
        res.send(post)
      }).catch((e) => {
        console.log('viewed', {e})
      })
    } else {
      handleErr(err, res, 'error fetching post')
    }
  })
})
router.get('/usergigs/:author', (req, res) => {
  let {author} = req.params
  Post.find({author}).exec((err, results) => {
    if (!err) {
      let dataToSend = []
      let sendIt = () => {
        if (dataToSend.length === results.length) {
          res.send(dataToSend)
        }
      }
      results.forEach(element => {
        let {author, permlink} = element
        steem.api.getContent(author, permlink, function (err, post) {
          if (!err) {
            try {
              post.rep = calcRep(post.author_reputation)
              post.json_metadata = JSON.parse(post.json_metadata)
            } catch (e) {
              console.log({e, post})
            }
            dataToSend.push(post)
            sendIt()
          }
        })
      })
      sendIt()
    } else {
      handleErr(err, res, 'errror fetching post')
    }
  })
})
router.get('/steembycat/:category', (req, res) => {
  let {category} = req.params
  Post.find({category}).exec((err, results) => {
    if (!err) {
      let dataToSend = []
      let sendIt = () => {
        if (dataToSend.length === results.length) {
          res.send(dataToSend)
        }
      }
      results.forEach(element => {
        let {author, permlink} = element
        steem.api.getContent(author, permlink, function (err, post) {
          if (!err) {
            try {
              post.rep = calcRep(post.author_reputation)
              post.json_metadata = JSON.parse(post.json_metadata)
              User.findOne({username: author}).exec((err, profile) => {
                if (!err && profile) {
                  if (profile.profilePic) {
                    post.json_metadata.authorPic = profile.profilePic
                  }
                }
              })
            } catch (e) {
              console.log({e, post})
            }
            dataToSend.push(post)
            sendIt()
          }
        })
      })
      sendIt()
    } else {
      handleErr(err, res, 'errror fetching post')
    }
  })
})
router.get('/steembysubcat/:subcategory', (req, res) => {
  let {subcategory} = req.params
  console.log('subcategory', subcategory)
  Post.find({subcategory}).exec((err, results) => {
    if (!err) {
      let dataToSend = []
      let sendIt = () => {
        if (dataToSend.length === results.length) {
          res.send(dataToSend)
        }
      }
      results.forEach(element => {
        let {author, permlink} = element
        steem.api.getContent(author, permlink, function (err, post) {
          if (!err) {
            try {
              post.rep = calcRep(post.author_reputation)
              post.json_metadata = JSON.parse(post.json_metadata)
              User.findOne({username: author}).exec((err, profile) => {
                if (!err && profile) {
                  if (profile.profilePic) {
                    post.json_metadata.authorPic = profile.profilePic
                  }
                }
              })
            } catch (e) {
              console.log({e, post})
            }
            dataToSend.push(post)
            sendIt()
          }
        })
      })
      sendIt()
    } else {
      handleErr(err, res, 'errror fetching post')
    }
  })
})
router.get('/featured', (req, res) => {
  res.send([])
})
router.get('/steemgigs/:type?/:limit?/:page?/:last_id?', (req, res) => {
  let type = req.params.type || 'steemgigs_post'
  let limit = req.params.limit || 50
  let page = req.params.page || 1
  let lastId = req.params.last_id
  console.log('type:', type, 'limit:', limit, 'page:', page)
  if (lastId) {
  } else {
    Post.find({type}).skip(limit * (page - 1)).limit(Number(limit)).exec((err, results) => {
      console.log(type, results.length)
      if (!err) {
        let dataToSend = []
        let resultLength = results.length
        let sendIt = () => {
          if (dataToSend.length === resultLength) {
            res.send(dataToSend)
          }
        }
        results.forEach(element => {
          let {author, permlink} = element
          steem.api.getContent(author, permlink, function (err, post) {
            if (!err) {
              try {
                post.rep = calcRep(post.author_reputation)
                post.json_metadata = JSON.parse(post.json_metadata)
                User.findOne({username: author}).exec((err, profile) => {
                  if (!err && profile) {
                    if (profile.profilePic) {
                      post.json_metadata.authorPic = profile.profilePic
                    }
                  }
                })
              } catch (e) {
                // console.log({e, post, author})
              }
              if (post.author) {
                dataToSend.push(post)
              } else {
                resultLength--
              }
              sendIt()
            } else {
              console.log({err})
            }
          })
          // SteemPost.findOne({author, permlink}).exec((err, data) => {
          //   if (data) {
          //     data = data.toObject({getters: true})
          //     if (!err) {
          //       SteemAccount.findOne({account: author}).exec((err, profile) => {
          //         if (!err) {
          //           profile = profile.toObject({getters: true})
          //           data.rep = profile.rep
          //           data.userImg = profile.json_metadata.profile.profile_image
          //           dataToSend.push(data)
          //           sendIt()
          //         }
          //       })
          //     } else {
          //       handleErr(err, res, 'errror fetching post')
          //     }
          //   } else {
          //     console.log({author, permlink})
          //     resultLength--
          //     sendIt()
          //   }
          // })
        })
        sendIt()
      } else {
        handleErr(err, res, `error finding ${type}`)
      }
    })
  }
})

router.get('/:account/*.json', (req, res) => {
  let requested = req.params
  console.log(requested)
  res.send('you requested for: ' + requested)
})

router.get('/sc2', (req, res) => {
  res.send('sc222222 qbi')
  console.log(sc2)
})

module.exports = router
