
const logger = require('./logger')

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
    return require('./app').stop()
        .then(() => require('./db').disconnect())
        .then(() => require('./raptor').client().getClient().disconnect())
}

module.exports.start = start
module.exports.stop = stop
