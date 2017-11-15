
const errors = require('./errors')
const raptor = require('./raptor').client()

const authenticate = (/*opts*/) => {
    // opts = opts || {}
    return function(req, res, next) {

        const header = req.headers.authorization
        if(!header) {
            return next(new errors.Unauthorized('Missing token'))
        }

        const token = header.replace('Bearer ','')

        return raptor.Admin().Token().check({ token })
            .then((u) => {
                req.user = u
                next()
            })
            .catch((e) => Promise.reject(new errors.Unauthorized(e.message)))
    }
}

const authorize =  (opts) => {
    opts = opts || {}
    return function(req, res, next) {

        //pattern based /<api>/<id>
        const getId = () => {
            const id = req.url.split('/')[1]
            if (!id) throw new Error('Cannot parse id')
            return id
        }

        // skip test if has service or admin role
        if(req.user.isService() || req.user.isAdmin()) {
            return next()
        }

        const
            userId = req.user.id,
            type = opts.type

        let permission, subjectId
        switch (req.method.toLowerCase()) {
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

        return raptor.Auth().can( type, permission, subjectId, userId).then((res) => {
            if (!res.result) {
                return next(new errors.Unauthorized())
            }
            next()
        })
    }
}


module.exports = {authenticate, authorize}
