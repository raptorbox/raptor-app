
const logger = require('./logger')
const config = require('./config')

module.exports = () => {
    logger.debug('Connecting to db')
    return require('./db').connect(config.mongodb)
        .then(() => {
            logger.info('Initializing raptor client')
            return require('./raptor').initialize(config.url, config.broker, config.service)
        })
}
