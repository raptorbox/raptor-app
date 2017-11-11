const express = require('express')
const bodyParser = require('body-parser')

const errors = require('raptor-auth/errors')
const logger = require('./logger')

let app

const initialize = (router) => {

    if (app) {
        return app
    }

    app = express()

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))

    // //generate API docs
    // app.get('/swagger.json', function(req, res) {
    //     res.json(require('./swagger')())
    // })

    app.use('/', router)

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
}

const start = () => {

    const app = initialize()

    server = require('http').Server(app)
    return new Promise(function(resolve, reject) {
        server.listen(config.port, function(err) {
            if(err) return reject(err)
            logger.info(`Server listening on ::${config.port}`)
            resolve()
        })
    })

}

module.exports = { app, start }
