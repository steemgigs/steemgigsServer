const User = require('../model/user')
const steem = require('steem')
const { handleErr, stringify, calcRep } = require('../utils')
const SteemAccount = require('../model/steemData/Account')
const axios = require('axios')
const SSC = require('sscjs')
const ssc = new SSC('https://api.steem-engine.com/rpc')
const _ = require('lodash')

// POST Login
exports.login = (req, res) => {
  let {
    username
  } = req.body
  if (req.user === username) {
    User.findOne({
      username
    }).exec((err, profile) => {
      if (!err) {
        if (profile) {
          // returning user
          profile = profile.toObject({
            getters: true
          })
          if (profile.deleted) {
            res.json({
              tye: 'deleted user'
            })
          } else if (profile.disabled) {
            res.json({
              type: 'user disabled or banned'
            })
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
                res.json({
                  type: 'returning user',
                  profile
                })
              } else {
                console.log('error connecting to steem to fetch complete userData', stringify(err))
                res.json({
                  type: 'returning user',
                  profile
                })
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
              let {
                profile_image: profilePic,
                name,
                about,
                location,
                website,
                cover_image: coverPic,
                facebook,
                github,
                instagram,
                twitter,
                discord
              } = apiProfile
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
                  newProfileData = newProfileData.toObject({
                    getters: true
                  })
                  delete newProfileData.deleted
                  delete newProfileData.disabled
                  if (author.witness_votes.indexOf('steemgigs') > -1) {
                    newProfileData.steemgigsWitness = true
                  } else {
                    newProfileData.steemgigsWitness = false
                  }
                  newProfileData.balance = author.balance
                  newProfileData.rep = calcRep(author.reputation)
                  res.json({
                    type: 'new user',
                    profile: newProfileData
                  })
                }
              }).catch(err => {
                handleErr(err, res, 'error saving new user data')
              })
              console.log({
                author,
                profile
              })
            }
          })
        }
      } else {
        console.log(stringify(err))
        handleErr(err, res, 'could not fetch user details')
      }
    })
  } else {
    handleErr({
      error: 'unauthorized loggedIdn request'
    }, res, 'unauthorized loggeddIn request', 403)
  }
}

// POST Set Profile
exports.set_profile = (req, res) => {
  let {
    username
  } = req.body
  if (req.user === username) {
    SteemAccount.findOne({
      account: username
    }).exec((err, profileData) => {
      if (!err) {
        profileData = profileData.toObject({
          getters: true
        })
        let {
          profile_image: profileImage,
          name,
          about,
          location,
          website,
          cover_image: coverImage,
          facebook,
          github,
          instagram,
          twitter
        } = profileData.json_metadata.profile
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
            website,
            twitter,
            facebook,
            instagram,
            github
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
    handleErr({
      error: 'unauthorized loggedIn request'
    }, res, 'unauthorized loggedIn request', 403)
  }
}

// Edit Profile

exports.edit_profile = (req, res) => {
  let {username, name, expertise, test, about, profilePic, coverPic, languages, social, vacation, location, gender, skillsAndHobbies, learning, socialReach, helpWith, portfolio} = req.body
  if (req.user === username) {
    User.findOne({
      username
    }, (err, userData) => {
      if (!err) {
        if (userData) {
          if (name) {
            userData.name = name
          }
          if (skillsAndHobbies) {
            userData.skillsAndHobbies = skillsAndHobbies
          }
          if (portfolio) {
            userData.portfolio = portfolio
          }
          if (helpWith) {
            userData.helpWith = helpWith
          }
          if (socialReach) {
            userData.socialReach = socialReach
          }
          if (learning) {
            userData.learning = learning
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
              res.send(modifiedUserData)
            } else {
              handleErr(err, res, 'there was an error modifying your profile')
            }
          })
        } else {
          let newUser = new User({
            username,
            name,
            expertise,
            about,
            profilePic,
            coverPic,
            languages,
            social,
            vacation,
            location,
            gender
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
    handleErr({
      error: 'unauthorized profile modification attempt'
    }, res, 'you can only modify your own profile details', 403)
  }
}

// POST Verify User

exports.verify_user = (req, res) => {
  let {
    token
  } = req.body
  if (token) {
    axios.get(`https://steemconnect.com/api/me?access_token=${token}`).then(response => {
      let responseData = response.data
      res.send(responseData)
    }).catch(err => {
      if (err.response) {
        console.log(stringify(err.response.data))
        if (err.response.data.error) {
          handleErr(err.response.data, res, err.response.data.error, 401)
        } else {
          handleErr(err.response.data, res, 'verification error', 403)
        }
      } else {
        handleErr(err, res, 'verification server is unreachable')
      }
    })
  } else {
    handleErr(null, res, 'please supply a token', 401)
  }
}

// GET User Profile

exports.get_profile = (req, res) => {
  var username = req.params.username
  User.findOne({
    username
  }).exec((err, profile) => {
    if (!err) {
      if (profile) {
        profile = profile.toObject({
          getters: true
        })
      } else {
        profile = {}
      }
      if (profile.deleted) {
        res.json({
          tye: 'deleted user'
        })
      } else if (profile.disabled) {
        res.json({
          type: 'user disabled or banned'
        })
      } else {
        delete profile.deleted
        delete profile.disabled
        steem.api.getAccounts([username], function (err, authorArray) {
          let author = authorArray[0]
          if (!err) {
            if (Object.keys(profile).length === 0) {
              let apiProfile = {}
              if (JSON.parse(author.json_metadata).profile) {
                apiProfile = JSON.parse(author.json_metadata).profile
              }
              let {profile_image: profilePic, name, about, location, website, cover_image: coverPic, facebook, github, instagram, twitter, discord, skillsAndHobbies, helpWith} = apiProfile
              profile = {
                username,
                skillsAndHobbies: skillsAndHobbies || [],
                helpWith: helpWith || [],
                socialReach: socialReach || '',
                learning: learning || [],
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
            if (!profile.portfolio) {
              profile.portfolio = {
                description: '',
                url: ''
              }
            }
            profile.certifiedUloggerStatus = res.locals.certifiedUloggerStatus || false
            res.json(profile)
          } else {
            console.log('error connecting to steem to fetch complete userData', stringify(err))
            res.json(profile)
          }
        })
      }
    }
  })
}

// GET User Image

exports.get_user_image = (req, res) => {
  let {
    username
  } = req.params
  SteemAccount.findOne({
    'name': username
  }).exec((err, result) => {
    result = result.toObject({
      getters: true
    })
    if (!err) {
      let info = {}
      info.profileImage = result.json_metadata.profile.profile_image || 'https://via.placeholder.com/100x100'
      info.rep = result.rep
      res.send(info)
    } else {
      handleErr(err, res, 'user doesnt exit')
    }
  })
}

// GET Account

exports.get_account = (req, res) => {
  let requested = req.params
  console.log(requested)
  res.send('you requested for: ' + requested)
}

// GET Wallet

exports.get_wallet = (req, res) => {
  const username = req.params.username

  // Get Teardrop Balance using steemeng
  const getTearDropBalance = new Promise(function (resolve, reject) {
    try {
      ssc.findOne(
        'tokens',
        'balances', {
          account: username,
          symbol: 'TEARDROPS'
        }, (err, result) => {
          if (!err) {
            if (result.balance)
            resolve({
              teardrop_balance: parseInt(result.balance, 10).toFixed(3)
            })
          } else {
            resolve({
              teardrop_balance: 0
            })
          }
        })
    } catch (err) {
      console.log(err)
      reject(err)
      handleErr(err, res, 'Error gathering transactions')
    }
  })

  // Get Account Details
  const getAccountData = new Promise(function (resolve, reject) {
    try {
      steem.api.getAccounts([username], function (err, result) {
        if (!err) {
          resolve({
            steem_balance: result[0].balance,
            sbd_balance: result[0].sbd_balance,
            steem_savings: result[0].savings_balance,
            sbd_savings: result[0].savings_sbd_balance,
            vesting_shares: result[0].vesting_shares,
            delegated_vesting_shares: result[0].delegated_vesting_shares,
            received_vesting_shares: result[0].received_vesting_shares
          })
        }
      })
    } catch (err) {
      console.log(err)
      reject(err)
      handleErr(err, res, 'Error gathering transactions')
    }
  })

  // Get dynamic Properties in order calculate steem power totals
  const DynamicProperties = new Promise(function (resolve, reject) {
    try {
      steem.api.getDynamicGlobalProperties(function (err, result) {
        if (!err) {
          resolve({
            totalVestingShare: result.total_vesting_shares,
            totalVestingFund: result.total_vesting_fund_steem
          })
        }
      })
    } catch (err) {
      console.log(err)
      reject(err)
      handleErr(err, res, 'Error gathering transactions')
    }
  })

  Promise.all([getTearDropBalance, getAccountData, DynamicProperties])
    .then(function ([teardropBalance, generalBalances, DynamicProperties]) {
      const balances = {
        ...teardropBalance,
        ...generalBalances
      }
      balances.steem_power = steem.formatter.vestToSteem(generalBalances.vesting_shares, DynamicProperties.totalVestingShare, DynamicProperties.totalVestingFund).toFixed(3)
      balances.delegated_steem_power = steem.formatter.vestToSteem((generalBalances.received_vesting_shares.split(' ')[0] - generalBalances.delegated_vesting_shares.split(' ')[0]) + ' VESTS', DynamicProperties.totalVestingShare, DynamicProperties.totalVestingFund)
      res.send(balances)
    }).catch(function (err) {
      console.log(err)
      handleErr(err, res, 'Error gathering transactions')
    })
}

// GET Transactions

exports.get_transactions = (req, res) => {
  const username = req.params.username

  // Get tranfers transactions from steem
  const steemTransactions = new Promise(function (resolve, reject) {
    try {
      steem.api.getAccountHistory(username, -1, 3000, (err, result) => {
        if (!err) {
          const transfers = result.filter(tx => tx[1].op[0] === 'transfer')
          resolve(transfers)
        }
      })
    } catch (err) {
      console.log(err)
      reject(err)
      handleErr(err, res, 'Error gathering transactions')
    }
  })

  // Get TEARDROPS transactions for a user, added via http request as unable to find query in docs how to do this via npm package
  const getTearDropsTransactions = new Promise(function (resolve, reject) {
    axios.get(`https://api.steem-engine.com/accounts/history?account=${username}&limit=100&offset=0&type=user&symbol=TEARDROPS&v=1552513635377`)
      .then(function (response) {
        resolve(response)
      })
      .catch(function (err) {
        console.log(err)
        reject(err)
        handleErr(err, res, 'Error gathering transactions')
      })
  })

  Promise.all([steemTransactions, getTearDropsTransactions])
    .then(function ([steemTransactions, tearDropsTransactions]) {
      // Create array to send back details formatted for client
      let transactions = []

      // Iterate through steem transaction history and only add require transaction data to transaction object
      steemTransactions.forEach(transaction => {
        transactions.push({
          details: transaction[1].op[1],
          timestamp: transaction[1].timestamp
        })
      })

      // Iterate through teardrops transaction history and only add require transaction data to transaction object
      tearDropsTransactions.data.forEach(transaction => {
        transactions.push({
          details: {
            from: transaction.from,
            to: transaction.to,
            amount: transaction.quantity + ' TEARDROPS',
            memo: transaction.memo
          },
          timestamp: transaction.timestamp
        })
      })

      // Sort transactions using lodash (sorted asc by default)
      transactions = _.sortBy(transactions, function (dateObj) {
        return new Date(dateObj.timestamp)
      })

      // Send to client in descending order
      res.send(transactions.reverse())
    }).catch(function (err) {
      console.log(err)
      handleErr(err, res, 'Error gathering transactions')
    })
}
