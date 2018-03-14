const router = require('express').Router()
const sc2 = require('../factory/sc2')
const steem = require('steem')
const { handleErr, stringify, calcRep } = require('../utils')

const SteemAccount = require('../model/steemData/Account')
const Post = require('../model/post')
const User = require('../model/user')

router.post('/loggedIn', (req, res) => {
  let {username} = req.body
  if (req.user === username) {
    User.findOne({username}).exec((err, profile) => {
      if (!err) {
        if (profile) {
          // returning user
          profile = profile.toObject({getters: true})
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
                profile.balance = author.balance
                profile.rep = calcRep(author.reputation)
                if (author.witness_votes.indexOf('steemgigs') > -1) {
                  profile.steemgigsWitness = true
                } else {
                  profile.steemgigsWitness = false
                }
                res.json({type: 'returning user', profile})
              } else {
                console.log('error connecting to steem to fetch complete userData', stringify(err))
                res.json({type: 'returning user', profile})
              }
            })
          }
        } else {
          // new user
          steem.api.getAccounts([username], function (err, authorArray) {
            let author = authorArray[0]
            if (!err) {
              console.log('I got account')
              let apiProfile = {}
              if (JSON.parse(author.json_metadata).profile) {
                apiProfile = JSON.parse(author.json_metadata).profile
              }
              let {profile_image: profilePic, name, about, location, website, cover_image: coverPic, facebook, github, instagram, twitter, discord} = apiProfile
              let profile = {
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
              let newUser = new User(profile)
              newUser.save((err, newProfileData) => {
                if (!err) {
                  newProfileData = newProfileData.toObject({getters: true})
                  delete newProfileData.deleted
                  delete newProfileData.disabled
                  if (author.witness_votes.indexOf('steemgigs') > -1) {
                    newProfileData.steemgigsWitness = true
                  } else {
                    newProfileData.steemgigsWitness = false
                  }
                  newProfileData.balance = author.balance
                  newProfileData.rep = calcRep(author.reputation)
                  res.json({type: 'new user', profile: newProfileData})
                }
              }).catch(err => {
                handleErr(err, res, 'error saving new user data')
              })
              console.log({author, profile})
            }
          })
          // SteemAccount.findOne({account: username}).exec((err, profileData) => {
          //   if (!err) {
          //     profileData = profileData.toObject({getters: true})
          //     console.log(stringify(profileData))
          //     let {profile_image: profileImage, name, about, location, website, cover_image: coverImage, facebook, github, instagram, twitter} = profileData.json_metadata.profile
          //     let newUser = new User({
          //       username,
          //       name,
          //       about,
          //       location,
          //       social: {
          //         website, twitter, facebook, instagram, github
          //       },
          //       profilePic: profileImage,
          //       coverPic: coverImage
          //     })
          //     newUser.save((err, newProfileData) => {
          //       if (!err) {
          //         newProfileData = newProfileData.toObject({getters: true})
          //         console.log('newUser Rep:', profileData.rep || profileData.reputation)
          //         newProfileData.rep = profileData.rep || profileData.reputation
          //         newProfileData.balance = profileData.balance.amount
          //         delete newProfileData.deleted
          //         delete newProfileData.disabled
          //         res.json({type: 'new user', profile: newProfileData})
          //       }
          //     }).catch(err => {
          //       handleErr(err, res, 'error saving new user data')
          //     })
          //   } else {
          //     handleErr(err, res, 'error fetching profile data')
          //   }
          // })
        }
      } else {
        console.log(stringify(err))
        handleErr(err, res, 'could not fetch user details')
      }
    })
  } else {
    handleErr({error: 'unauthorized loggedIn request'}, res, 'unauthorized loggedIn request', 403)
  }
})
router.post('/profile', (req, res) => {
  let {username} = req.body
  if (req.user === username) {
    SteemAccount.findOne({account: username}).exec((err, profileData) => {
      if (!err) {
        profileData = profileData.toObject({getters: true})
        let {profile_image: profileImage, name, about, location, website, cover_image: coverImage, facebook, github, instagram, twitter} = profileData.json_metadata.profile
        let steemgigsWitness
        if (profileData.witness_votes.indexOf('steemgigs') > -1) {
          steemgigsWitness = true
        } else {
          steemgigsWitness = false
        }
        let profileObject = {
          username,
          name,
          about,
          location,
          social: {
            website, twitter, facebook, instagram, github
          },
          profilePic: profileImage,
          coverPic: coverImage,
          rep: profileData.rep,
          balance: profileData.balance,
          steemgigsWitness
        }
        res.json(profileObject)
      } else {
        handleErr(err, res, 'error fetching profile data')
      }
    })
  } else {
    handleErr({error: 'unauthorized loggedIn request'}, res, 'unauthorized loggedIn request', 403)
  }
})

router.post('/post', (req, res) => {
  try {
    let { username, permlink, title, body, liked, upvoteRange, jsonMetadata } = req.body
    console.log({username, permlink, title, jsonMetadata, liked, upvoteRange})
    let token = req.token
    sc2.setAccessToken(token)
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
                  res.send('Successfully pushed to steem!')
                } else {
                  handleErr(err, res, 'there was an error please try again')
                }
              })
            } else {
              let newPost = new Post({ title, author: username, permlink, tags: jsonMetadata.tags, price: jsonMetadata.price, currency: jsonMetadata.currency, category: jsonMetadata.category, subcategory: jsonMetadata.subcategory, type: jsonMetadata.type, url: postURL })
              newPost.save(err => {
                if (!err) {
                  res.send('Successfully pushed to steem!')
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
})
router.post('/comment', (req, res) => {
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
})

router.post('/editProfile', (req, res) => {
  let {username, name, expertise, test, about, profilePic, coverPic, languages, social, vacation, location, gender} = req.body
  console.log('from frontend', {test, vacation})
  if (req.user === username) {
    User.findOne({username}, (err, userData) => {
      if (!err) {
        if (userData) {
          console.log('fetched userData::', stringify(userData))
          if (name) {
            userData.name = name
          }
          if (expertise) {
            userData.expertise = expertise
          }
          if (about) {
            userData.about = about
          }
          if (profilePic) {
            userData.profilePic = profilePic
          }
          if (coverPic) {
            userData.coverPic = coverPic
          }
          if (languages) {
            userData.languages = languages
          }
          if (social) {
            userData.social = social
          }
          if (location) {
            userData.location = location
          }
          if (gender) {
            userData.gender = gender
          }
          userData.vacation = vacation
          userData.save((err, modifiedUserData) => {
            if (!err) {
              console.log('modified user Data::', stringify(modifiedUserData))
              res.send(modifiedUserData)
            } else {
              handleErr(err, res, 'there was an error modifying your profile')
            }
          })
        } else {
          let newUser = new User({
            username, name, expertise, about, profilePic, coverPic, languages, social, vacation, location, gender
          })
          newUser.save((err, newUserData) => {
            if (!err) {
              res.send(newUserData)
            } else {
              handleErr(err, res, 'error saving new user data')
            }
          })
        }
      } else {
        handleErr(err, res, 'we couldn\'t locate this user in our records')
      }
    })
  } else {
    handleErr({error: 'unauthorized profile modification attempt'}, res, 'you can only modify your own profile details', 403)
  }
})

module.exports = router
