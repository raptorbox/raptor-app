
const assert = require('chai').assert
const util = require('./util')

describe('app service', function () {

    before(function () {
        return require('../index').start()
    })
    after(function () {
        return require('../index').stop()
    })

    describe('App API', function () {

        it('should create an app', function () {
            return util.getRaptor()
                .then(function (r) {
                    return r.App().create({
                        name: util.randomName(),
                        role: [
                            {
                                name: 'foo',
                                permissions: ['bar']
                            }
                        ]
                    }).then((app) => {
                        assert.isTrue(app.users.length === 1)
                        assert.isTrue(app.users.filter((u) => u.id === r.Auth().getUser().id).length === 1)
                        return Promise.resolve()
                    })
                })
        })

    })
})
