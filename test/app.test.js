
const assert = require('chai').assert
const util = require('./util')
const Promise = require('bluebird')
const logger = require('../logger')

const createApp = () => {
    return util.getRaptor().then((r) => {
        const ops = [
            r.Inventory().create({ name: util.randomName('dev1')}),
            r.Inventory().create({ name: util.randomName('dev2')}),

            util.createUserInstance(),
            util.createUserInstance(),
        ]

        return Promise.all(ops).then((ops) => {

            const
                dev1 = ops[0],
                dev2 = ops[1],
                u1 = ops[2],
                u2 = ops[3],
                u1id = u1.Auth().getUser().id,
                u2id = u2.Auth().getUser().id

            return r.App().create({
                name: util.randomName('app'),
                role: [{name: 'test1', permissions: ['admin_device']}],
                users: [
                    { id: u1id, role: ['test1'] },
                    { id: u2id, role: ['test1'] },
                ],
                devices: [ dev1.id, dev2.id ]
            })
                .then((app) => {

                    assert.equal(2, app.devices.length)
                    assert.equal(3, app.users.length)
                    assert.equal(1, app.roles.length)

                    return Promise.resolve({
                        app, dev1, dev2, u1, u2id, u1id
                    })
                })
        })
    })
}

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

        it('should delete an app', function () {
            return util.getRaptor().then(function (r) {
                return r.App().create({
                    name: util.randomName(),
                    role: [{name: 'foo',permissions: ['bar']}]
                }).then((app) => {
                    return r.App().delete(app).then(() => {
                        return r.App().read(app)
                            .catch((e) => {
                                assert.equal(404, e.code)
                                return Promise.resolve()
                            })
                    })
                })
            })
        })

        it('should search for apps', function () {
            return util.getRaptor().then(function (r) {
                return createApp().then(({app}) => {
                    return r.App().search({id: app.id}).then((pager) => {
                        const apps = pager.getContent()
                        logger.debug('Found %s apps', apps.length)
                        assert.equal(1, apps.length)
                        return Promise.resolve()
                    })
                }).then(() => {
                    return createApp().then(({ u2id }) => {
                        return r.App().search({users: [ u2id ] }).then((pager) => {
                            const apps = pager.getContent()
                            logger.debug('Found %s apps', apps.length)
                            return Promise.resolve()
                        })
                    })
                })

            })
        })

    })
})
