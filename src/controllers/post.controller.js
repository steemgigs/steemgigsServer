const Post = require('../model/post')
const User = require('../model/user')
const sc2 = require('../factory/sc2')
const { handleErr, stringify, calcRep } = require('../utils')
const steem = require('steem')

// POST Create post

exports.create_post = (req, res) => {
  try {
    let { username, permlink, title, body, liked, upvoteRange, jsonMetadata } = req.body
    console.log({username, permlink, title, jsonMetadata, liked, upvoteRange})
    let token = req.token
    sc2.setAccessToken(token)
    console.log(`hello ${token}`)
    sc2.comment('', 'steemgigs', username, permlink, title, body, jsonMetadata, (err, result) => {
      if (err) {
        console.log('err', err)
        handleErr(err, res, 'Error pushing post to steem, you might have used the same title previous time', 500)
      } else {
        console.log({result})
        if (liked) {
          sc2.setAccessToken(token)
          sc2.vote(username, username, permlink, parseInt(upvoteRange) * 100, (err, res) => {
            if (!err) {
              console.log('post liked')
              console.log({liked})
            }
          })
        }
        let postURL = `/steemgigs/@${username}/${permlink}`
        console.log('result(posted to steem)::', stringify(result))
        console.log('posted!, saving to steemggis db...')
        console.log('result url:', postURL)
        Post.count({ url: postURL }, (err, count) => {
          console.log('no of exsiting url', count, 'error counting:', err)
          if (!err) {
            if (count > 0) {
              Post.findOneAndUpdate({ url: postURL }, { title, author: username, permlink, tags: jsonMetadata.tags, price: jsonMetadata.price, currency: jsonMetadata.currency, category: jsonMetadata.category, subcategory: jsonMetadata.subcategory, type: jsonMetadata.type }, (err, result) => {
                if (!err) {
                  res.send({
                    permlink: permlink
                  })
                } else {
                  handleErr(err, res, 'there was an error please try again')
                }
              })
            } else {
              let newPost = new Post({ title, author: username, permlink, tags: jsonMetadata.tags, price: jsonMetadata.price, currency: jsonMetadata.currency, category: jsonMetadata.category, subcategory: jsonMetadata.subcategory, type: jsonMetadata.type, url: postURL })
              newPost.save(err => {
                if (!err) {
                  res.send({
                    permlink: permlink
                  })
                } else {
                  res.send('please try again')
                }
              })
            }
          } else {
            handleErr(err, res, 'there was an error please try again')
          }
        })
      }
    })
  } catch (error) {
    handleErr(error, res, 'error posting your steemgigs')
  }
}

// Create Comment

exports.create_comment = (req, res) => {
  try {
    let { parentAuthor, parentPermlink, username, body } = req.body
    let now = new Date().toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\./g, '').replace(/Z/, 'z').replace(/T/, 't')
    let permlink = `re-${parentAuthor}-${parentPermlink}-${now}`
    sc2.setAccessToken(req.token)
    sc2.comment(parentAuthor, parentPermlink, username, permlink, '', body, { generated: true }, (error, result) => {
      if (error) {
        handleErr(error, res, 'Error posting your comment, try again', 500)
      } else {
        steem.api.getContentReplies(parentAuthor, parentPermlink, function (err, comments) {
          if (!err) {
            let dataToSend = []
            let sendIt = () => {
              if (dataToSend.length === comments.length) {
                res.send(dataToSend)
              }
            }
            comments.forEach(comment => {
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
            console.log('error fetching comments')
          }
        })
      }
    })
  } catch (error) {
    handleErr(error, res, 'error posting your comment')
  }
}

// GET Comments
exports.get_comments = (req, res) => {
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
}

// GET Comment

exports.get_comment = (req, res) => {
  let {username: author, permlink} = req.params
  steem.api.getContentReplies(author, permlink, function (err, comment) {
    if (!err) {
      res.send(comment)
    } else {
      handleErr(err, res, 'error fetching comments')
    }
  })
}

// GET Post

exports.get_post = (req, res) => {
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
}

// GET User Gig

exports.user_gigs = (req, res) => {
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
}

// GET Featured Posts

exports.get_featured = (req, res) => {
  res.send([])
}

// GET Steemgigs

exports.get_steemGigs = (req, res) => {
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
        })
        sendIt()
      } else {
        handleErr(err, res, `error finding ${type}`)
      }
    })
  }
}

// GET Steem by category

exports.getByCategory = (req, res) => {
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
}

// GET Steem by SubCategory

exports.getBySubCategory = (req, res) => {
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
}
