
const api = require('../api')
const auth = require('../auth')

const router = require('express-promise-router')()

router.use(auth.authenticate())

const authz = () => auth.authorize({ type: 'app' })

router.get('/', function(req, res) {

    const q = {
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
        q.id = raw.id
    }

    if (raw.domain && typeof raw.domain === 'string') {
        q.domain = raw.domain
    }

    if (raw.name && typeof raw.name === 'string') {
        q.name = raw.name
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

module.exports = router
