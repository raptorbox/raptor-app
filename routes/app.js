
const api = require('../api')
const auth = require('../auth')

const router = require('express-promise-router')()

router.use(auth.authenticate())
router.use(auth.authorize({ type: 'app' }))

router.get('/', function(req, res) {

    const q = {
        userId: req.user.id
    }

    if (req.query.userId) {
        q.userId = req.query.userId
        delete req.query.userId
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
    if (raw.devices && raw.devices instanceof Array) {
        q.devices = { $in: raw.devices }
    }

    if (raw.id && typeof raw.id === 'string') {
        q.id = raw.id
    }

    const pager = Object.assign({}, req.query)

    return api.App.list(q, pager)
        .then((apps) => {
            res.json(apps)
        })
})

router.get('/:id', function(req, res) {
    const q = { id: req.params.id }
    return api.App.read(q)
        .then((app) => res.json(app))
})

router.post('/', function(req, res) {
    const raw = Object.assign({}, req.body, { userId: req.user.id })
    return api.App.create(raw)
        .then((app) => res.json(app))
})

router.put('/:id', function(req, res) {
    const raw = Object.assign({}, req.body, { id: req.params.id })
    return api.App.update(raw)
        .then((app) => res.json(app))
})

router.delete('/:id', function(req, res) {
    const raw = { id: req.params.id }
    return api.App.delete(raw)
        .then((app) => res.json(app))
})

module.exports = router
