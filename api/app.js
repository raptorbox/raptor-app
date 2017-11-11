
const l = module.exports

const errors = require('../errors')
const App = require('../models/app')
const broker = require('../broker')

const notify = (op, app) => {
    broker.send({type: 'app', id: app.id, op, app})
    return Promise.resolve(app)
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
    const app = new App(t)
    return app.save()
        .then(() => notify('create', app))
}

l.delete = (app) => {
    return App.remove(app)
        .then((app) => notify('delete', app))
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
