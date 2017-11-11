
const logger = require('./logger')

let server = null

const start = () => {

    const config = require('./config')

    logger.level = process.env.LOG_LEVEL || config.logLevel || 'info'

    // mongoose
    return require('./setup')()
        .then(() => {
            logger.debug('Starting server')
            return require('./app').start(config.port)
        })
}

const stop = () => {
    return new Promise(function(resolve, reject) {
        if(server === null) return resolve()
        server.close(function(err) {
            if(err) return reject(err)
            logger.info('Server stopped')
            resolve()
        })
    })
        .then(() => {
            return require('./db').disconnect()
        })
        .then(() => {
            return require('./broker').close()
        })
        .then(() => {
            return require('./cache').close()
        })
}

module.exports.start = start
module.exports.stop = stop
