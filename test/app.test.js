
const assert = require('chai').assert
const util = require('./util')

describe('app service', function () {

    before(util.before)
    after(util.after)

    describe('App API', function () {

        it('should create an app', function () {
            return util.getRaptor().then(function (r) {
                return r.App().create({
                    name: util.randomName(),
                    role: [
                        {
                            name: 'foo',
                            permissions: ['bar']
                        }
                    ]
                }).then((app) => {

                    assert.equal(1, app.users.filter((u) => u.id === r.Auth().getUser().id).length)

                    assert.equal(1, app.users.length)
                    assert.equal(app.userId, r.Auth().getUser().id)

                    assert.equal(1, app.roles.length)

                    return Promise.resolve()
                })
            })
        })

        it('should update an app', function () {
            return util.getRaptor().then(function (r) {
                return r.App().create({
                    name: util.randomName(),
                    role: [{name: 'foo',permissions: ['bar']}]
                }).then((app) => {
                    app.roles.push({name: 'foo2', permissions: ['bar', 'baz']})
                    return r.App().update(app)
                }).then((app) => {
                    assert.equal(2, app.roles.length)
                    return Promise.resolve()
                })
            })
        })

    })
})
