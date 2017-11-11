
const errors = require('./errors')

const authenticate = function(req, res, next) {

    const api = require('./raptor').client()

    const header = req.headers.Authorization

    if(!header) {
        return next(new error.Unauthorized('Missing token'))
    }

    const token = header.replace('Bearer ')
    //
    // return api.Admin().User().check({
    //     type: 'app',
    //     userId: req.user.id,
    //     permission: perm,
    //     subjectId: subj
    // }).then((res) => {
    //     if (!res.result) {
    //         return next(new errors.Unauthorized())
    //     }
    //     next()
    // })
}
const authorize = function(req, res, next) {

    const api = require('./raptor').client()

    const getId = () => {
        return req.url.split('/')[1]
    }

    let perm, subj
    switch (req.method.toLower()) {
    case 'get':
        perm = 'read'
        subj = getId()
        break
    case 'post':
        perm = 'create'
        break
    case 'put':
        perm = 'update'
        subj = getId()
        break
    case 'delete':
        perm = 'delete'
        subj = getId()
        break
    }

    return api.Admin().User().check({
        type: 'app',
        userId: req.user.id,
        permission: perm,
        subjectId: subj
    }).then((res) => {
        if (!res.result) {
            return next(new errors.Unauthorized())
        }
        next()
    })
}

module.exports = () => {

    const router = require('express-promise-router')()

    router.use(authenticate())
    router.use(authorize())

    return router
}
