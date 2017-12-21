
const l = module.exports

const errors = require('../errors')
const logger = require('../logger')
const App = require('../models/app')
const raptor = require('../raptor').client()

const notify = (op, app) => {
    return raptor.getClient().publish( `app/${app.id}`, {type: 'app', id: app.id, op, app})
        .then(() => Promise.resolve(app))
        .catch((e) => {
            logger.error('Failed to publish app `%s.%s`: %s', app.name, op, e.message)
            logger.debug(e.stack)
            return Promise.resolve(app)
        })
}

l.list = (query, pager) => {
    query = query || {}
    pager = pager || {}
    return App.findPaged(query, pager)
}

l.read = (query) => {
    return App.findOne(query)
        .then((app) => {
            if(!app) throw new errors.NotFound()
            return Promise.resolve(app)
        })
}

l.update = (t) => {
    return l.read({ id: t.id })
        .then(app => app.merge(t)
            .then((app) => app.save()
                .then(() => notify('update', app))
            )
        )
}

l.create = (t) => {
    return (new App()).merge(t)
        .then((app) => app.save())
        .then((app) => notify('create', app))
}

l.delete = (app) => {
    const json = Object.assign({}, app)
    return App.remove(app)
        .then((app) => notify('delete', json))
}

l.save = (t) => {
    return l.update(t)
        .catch((e) => {
            if(e instanceof errors.NotFound) {
                return l.create(t)
            }
            return Promise.reject(e)
        })
}
