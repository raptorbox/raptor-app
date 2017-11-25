const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const errors = require('./errors')
const logger = require('./logger')

let server

const initialize = () => {

    const app = express()

    app.use(cors())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))

    // //generate API docs
    // app.get('/swagger.json', function(req, res) {
    //     res.json(require('./swagger')())
    // })

    const routes = require('./routes')
    for(const path in routes) {
        logger.debug('Register path /%s', path)
        app.use(`/${path}`, routes[path])
    }

    // last call catch 404 and forward to error handler
    app.use(function(req, res, next) {
        next(new errors.NotFound())
    })

    // error handlers
    app.use(function(err, req, res, next) {

        if(err instanceof errors.HttpError) {
            res.status(err.code)
            res.json(err.toJSON())
            return
        }

        if(err.code && (err.code >= 400 && err.code <= 510)) {
            res.status(err.code)
            res.json({
                code: err.code,
                message: err.message
            })
            return
        }

        logger.error('Error: %s', err.message)
        logger.debug(err.stack)

        const internalError = new errors.InternalServer()
        res.status(internalError.code)
        res.json(internalError.toJSON())

    })

    return app
}

const start = (port) => {
    if(server) return Promise.resolve()
    const app = initialize()
    server = require('http').Server(app)
    return new Promise(function(resolve, reject) {
        server.listen(port, function(err) {
            if(err) return reject(err)
            logger.info(`Server listening on ::${port}`)
            resolve()
        })
    })

}

const stop = () => {
    return new Promise(function(resolve, reject) {
        if(!server) return resolve()
        server.close(function(err) {
            if(err) return reject(err)
            server = null
            logger.info('Server stopped')
            resolve()
        })
    })
}

module.exports = { start, stop }
