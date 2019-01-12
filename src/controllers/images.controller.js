const cloudinary = require('cloudinary')
const fileParser = require('connect-multiparty')()
const { stringify, handleErr } = require('../utils')

cloudinary.config({cloud_name: 'jalasem', api_key: '977684335728887', api_secret: 'DQkLl9L0x843jwLcXXivqDiNWxc'})

exports.upload_image = (fileParser, (req, res) => {
  var imageFile = req.files.photos
  cloudinary
    .v2
    .uploader
    .upload(imageFile.path, (error, result) => {
      if (!error) {
        if (result.url) {
          // res.send(result.url)
          res.send(result.secure_url)
        } else {
          handleErr(error, res, 'Error uploading your picture, Please try again')
          console.log('Error uploading to cloudinary: ', stringify(result))
        }
      } else {
        handleErr(error, res, 'Error uploading your picture, Please try again')
        console.log('Error uploading to cloudinary: \nerror: ', stringify(error))
      }
    })
})
