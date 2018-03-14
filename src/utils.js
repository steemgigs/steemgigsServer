module.exports = {
  handleErr (err, res, msg, code) {
    console.log(JSON.stringify(err, null, 2))
    res.status(code || 500).send(msg || 'there was error')
  },
  stringify (obj) {
    return JSON.stringify(obj, null, 2)
  },
  calcRep (reputation) {
    reputation = Math.log10(reputation)
    if (isNaN(reputation)) reputation = 0
    reputation = Math.max(reputation - 9, 0)
    reputation = (reputation * 9) + 25
    return parseInt(reputation)
  },
  fakeComment (username, body, parentAuthor, parentPermlink, permlink) {
    return {
      'active_votes': [],
      'allow_curation_rewards': true,
      'allow_replies': false,
      'allow_votes': true,
      'author': username,
      'author_rewards': 0,
      'beneficiaries': [],
      'body': body,
      'body_length': 0,
      'cashout_time': new Date() + 7,
      'category': 'steemgigs',
      'children': 0,
      'children_abs_rshares': 0,
      'community': '',
      'created': new Date(),
      'curator_payout_value': {
        'amount': 0,
        'asset': 'SBD'
      },
      'depth': 6,
      'id': 32680753,
      'json_metadata': {
        'generated': true,
        'tags': [],
        'users': []
      },
      'last_payout': '',
      'last_update': '',
      'max_accepted_payout': {
        'amount': 1000000,
        'asset': 'SBD'
      },
      'max_cashout_time': '1969-12-31T23:59:59.000Z',
      'net_rshares': 366020034,
      'net_votes': 1,
      'parent_author': parentAuthor,
      'parent_permlink': parentPermlink,
      'patched': false,
      'pending_payout_value': {
        'amount': 0,
        'asset': 'SBD'
      },
      'percent_steem_dollars': 10000,
      'permlink': permlink,
      'promoted': {
        'amount': 0,
        'asset': 'SBD'
      },
      'reblogged_by': [],
      'replies': [],
      'reward_weight': 10000,
      'root_comment': 29989383,
      'root_identifier': parentPermlink,
      'root_title': parentPermlink,
      'tags': [],
      'title': '',
      'total_payout_value': {
        'amount': 0,
        'asset': 'SBD'
      },
      'total_pending_payout_value': {
        'amount': 0,
        'asset': 'STEEM'
      },
      'total_vote_weight': 0,
      'updatedAt': '2018-02-15T11:31:41.024Z',
      'vote_rshares': 605932325
    }
  }
}
