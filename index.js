
const logger = require('./logger')

let server = null

const start = () => {

    const config = require('./config')

    logger.level = process.env.LOG_LEVEL || config.logLevel || 'info'

    // mongoose
    logger.debug('Connecting to db')
    return require('./db').connect(config.mongodb)
        .then(() => {
            logger.info('Initializing raptor client')
            return require('./raptor').initialize(config.url, config.service)
        })
        .then(() => {
            logger.debug('Starting server')
            return require('./app').start()
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
