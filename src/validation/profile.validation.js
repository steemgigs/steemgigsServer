const Joi = require('joi')

module.exports = {
  editProfile: {
    body: {
      username: Joi.string().lowercase().required(),
      name: Joi.string().required(),
      expertise: Joi.string().required(),
      vacation: Joi.boolean().required(),
      about: Joi.string().required(),
      profilePic: Joi.string().required(),
      coverPic: Joi.string().required(),
      languages: Joi.array().required(),
      social: Joi.object().required(),
      location: Joi.string().required(),
      gender: Joi.string().required(),
      skills: Joi.array().required(),
      interests: Joi.array().required(),
      learning: Joi.array().required(),
      help_with: Joi.array().required()
    }
  }
}
