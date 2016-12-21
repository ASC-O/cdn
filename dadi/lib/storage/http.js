var fs = require('fs')
var path = require('path')
var sha1 = require('sha1')
// var stream = require('stream')
var urljoin = require('url-join')
var wget = require('wget-improved')

// var Missing = require(path.join(__dirname, '/missing'))

var HTTPStorage = function (settings, url) {
  if (settings && !settings.remote.path) throw new Error('Remote address not specified')

  this.url = url

  if (settings) {
    this.baseUrl = settings.remote.path
  }
}

HTTPStorage.prototype.getFullUrl = function () {
  if (this.baseUrl) {
    return urljoin(this.baseUrl, this.url.replace('/http/', ''))
  } else {
    return this.url
  }
}

HTTPStorage.prototype.get = function () {
  return new Promise((resolve, reject) => {
    this.tmpFile = path.join(path.resolve(path.join(__dirname, '/../../../workspace')), sha1(this.url) + '-' + Date.now() + path.extname(this.url))

    var options = {
      headers: {
        'User-Agent': 'DADI CDN'
      }
    }

    var download = wget.download(this.getFullUrl(), this.tmpFile, options)

    download.on('error', (error) => {
      var err
      if (error.indexOf('404') > -1) {
        err = {
          statusCode: '404',
          message: 'Not Found: ' + this.getFullUrl()
        }

        return reject(err)
      } else {
        return reject(error)
      }
    })

    // download.on('start', function (fileSize) { })

    download.on('end', (output) => {
      console.log(output)
      return resolve(fs.createReadStream(this.tmpFile))
    })

    // download.on('progress', function (progress) {
      // console.log(Math.ceil(progress * 100) + '%')
    // })

    // if (err.statusCode === 404) {
    //   return new Missing().get().then((stream) => {
    //     this.notFound = true
    //     this.lastModified = new Date()
    //     return resolve(stream)
    //   }).catch((e) => {
    //     return reject(e)
    //   })
    // }
  })
}

/**
 * Removes the temporary file downloaded from the remote server
 */
HTTPStorage.prototype.cleanUp = function () {
  try {
    fs.unlinkSync(this.tmpFile)
  } catch (err) {
    console.log(err)
  }
}

module.exports = function (settings, url) {
  return new HTTPStorage(settings, url)
}

module.exports.HTTPStorage = HTTPStorage
