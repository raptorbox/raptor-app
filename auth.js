
const errors = require('./errors')
const raptor = require('./raptor').client()

const authenticate = (/*opts*/) => {
    // opts = opts || {}
    return function(req, res, next) {

        const header = req.headers.Authorization
        if(!header) {
            return next(new errors.Unauthorized('Missing token'))
        }

        const token = header.replace('Bearer ')

        return raptor.Admin().Token().check({ token })
            .then(next)
            .catch((e) => Promise.reject(new errors.Unauthorized(e.message)))
    }
}

const authorize =  (opts) => {
    opts = opts || {}
    return function(req, res, next) {

        //pattern based /<api>/<id>
        const getId = () => {
            return req.url.split('/')[2]
        }

        const
            userId = req.user.id,
            type = opts.type

        let permission, subjectId
        switch (req.method.toLower()) {
        case 'get':
            permission = 'read'
            subjectId = getId()
            break
        case 'post':
            permission = 'create'
            break
        case 'put':
            permission = 'update'
            subjectId = getId()
            break
        case 'delete':
            permission = 'delete'
            subjectId = getId()
            break
        }

        return raptor.Admin().User().check({ type, userId, permission, subjectId }).then((res) => {
            if (!res.result) {
                return next(new errors.Unauthorized())
            }
            next()
        })
    }
}


module.exports = {authenticate, authorize}
