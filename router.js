
const api = require('./api')
const auth = require('./auth')

const router = require('express-promise-router')()

router.use(auth.authenticate())
router.use(auth.authorize())

router.get('/', function(req, res) {
    const q = {}

    return api.App.list(q)
        .then((apps) => {
            res.json(apps)
        })
})

module.exports = router
