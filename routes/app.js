
const api = require('../api')
const auth = require('../auth')
const logger = require('../logger')

const router = require('express-promise-router')()

router.use(auth.authenticate())

const authz = () => auth.authorize({ type: 'app' })

router.get('/', function(req, res) {

    let q = {
        'users.id': req.user.id
    }

    if (req.query.userId) {
        q.userId = req.query.userId
        delete req.query.userId
    }

    if (req.query.domain) {
        q.domain = req.query.domain
        delete req.query.domain
    }

    if (req.query.name) {
        q.name = req.query.name
        delete req.query.name
    }

    if(req.user.isAdmin()) {
        q = {}
    }

    const pager = Object.assign({}, req.query)

    return api.App.list(q, pager)
        .then((apps) => {
            res.json(apps)
        })
})

router.post('/search', function(req, res) {

    const raw = Object.assign({}, req.body)
    const q = {}

    if (raw.users && raw.users instanceof Array) {
        q['users.id'] = { $in: raw.users }
    }

    if (raw.id && typeof raw.id === 'string') {
        // q.id = raw.id
        q.id = new RegExp(raw.id, 'i')
    }

    if (raw.domain && typeof raw.domain === 'string') {
        // q.domain = raw.domain
        q.domain = new RegExp(raw.domain, 'i')
    }

    if (raw.name && typeof raw.name === 'string') {
        q.name = new RegExp(raw.name, 'i')
        // q.name = { $regex: raw.name }
    } else if (raw.name && typeof raw.name === 'object') {
        let keys = Object.keys(raw.name)
        // if(keys[0] == 'contains') {
        //     q['name'] = { 'name': { '$regex': raw.name[keys[0]], '$options': 'i' } }
        // } else if(keys[0] == 'match') {
        if(raw.name[keys[0]] && raw.name[keys[0]] !== undefined) {
            // q['name'] = raw.name[keys[0]]
            q.name = new RegExp(raw.name[keys[0]], 'i')
        }
        // }
    }

    if(raw.properties && typeof raw.properties === 'object') {
        let keys = Object.keys(raw.properties)
        if(raw.properties[keys[0]] && raw.properties[keys[0]] !== undefined) {
            q['properties'] = raw.properties[keys[0]]
        }
    }

    const pager = Object.assign({}, req.query)

    return api.App.list(q, pager)
        .then((apps) => {
            res.json(apps)
        })
})

router.get('/:id', authz(), function(req, res) {
    const q = { id: req.params.id }
    return api.App.read(q)
        .then((app) => res.json(app))
})

router.post('/', authz(), function(req, res) {
    const raw = Object.assign({}, req.body, { userId: req.user.id })
    return api.App.create(raw)
        .then((app) => res.json(app))
})

router.put('/:id', authz(), function(req, res) {
    const raw = Object.assign({}, req.body, { id: req.params.id })
    return api.App.update(raw)
        .then((app) => res.json(app))
})

router.delete('/:id', authz(), function(req, res) {
    const raw = { id: req.params.id }
    return api.App.delete(raw)
        .then((app) => res.json(app))
})

router.get('/:appId/deleteUser/:userId', authz(), function(req, res) {
    const userId = req.params.userId
    const appId = req.params.appId
    
    return api.App.read({ id: appId })
        .then((app) => {
            let users = app.users
            for (var i = 0; i < users.length; i++) {
                if(users[i].id === userId) {
                    users.splice(i, 1)
                    break
                }
            }
            app.users = users
            return api.App.update(app)
                .then((a) => res.json(a))
        })
})

module.exports = router
