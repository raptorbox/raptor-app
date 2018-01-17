
const assert = require('chai').assert
const util = require('./util')
const Promise = require('bluebird')
const logger = require('../logger')

const createApp = () => {
    return util.getRaptor().then((r) => {
        const ops = [
            util.createUserInstance(),
            util.createUserInstance(),
        ]
        return Promise.all(ops).then((ops) => {

            const
                u1 = ops[0],
                u2 = ops[1],
                u1id = u1.Auth().getUser().id,
                u2id = u2.Auth().getUser().id

            return r.App().create({
                name: util.randomName('app'),
                role: [{name: 'test1', permissions: ['admin_device']}],
                users: [
                    { id: u1id, role: ['test1'] },
                    { id: u2id, role: ['test1'] },
                ]
            })
                .then((app) => {
                    return Promise.all([
                        r.Inventory().create({ name: util.randomName('dev1'), domain: app.id }),
                        r.Inventory().create({ name: util.randomName('dev2'), domain: app.id }),
                    ]).then((res) => {

                        const  dev1 = res[0],
                            dev2 = res[1]

                        assert.equal(3, app.users.length)
                        assert.equal(1, app.roles.length)

                        return Promise.resolve({
                            app, dev1, dev2, u1, u2id, u1id
                        })
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

        it('should allow delete own user with app', function () {
            return util.getRaptor().then(function (r) {
                return r.App().create({
                    name: util.randomName('app'),
                    roles: [{name: 'admin_own_user', permissions: ['admin_own_user']}],
                    users: []
                }).then((app) => {
                    // assert.equal(JSON.stringify(app), 1)
                    const user1 = util.newUser()
                    return r.Admin().User().create(user1).then((usr) => {
                        app.users.push({id:usr.id, role:['admin_own_user']})
                        return r.App().update(app).then(() => {
                            // assert.equal(JSON.stringify(app), 1)
                            return util.loginWithUser(user1.username, user1.password)
                                .then(function (userRaptor) {
                                    const u1 = userRaptor.Auth().getUser()
                                    const u = util.newUserWithOwnerId(u1.id)
                                    return r.Admin().User().create(u)
                                        .then(() => {
                                            return r.Admin().User().list({ownerId: u1.id})
                                                .then((users) => {
                                                    return Promise.resolve(users)
                                                })
                                        })
                                        .then((users) => {
                                            let query = {ownerId: u1.id, domain: app.id}
                                            return r.Admin().User().delete(users.json.content[0].id, query)
                                                .then(() => {
                                                    // assert.isTrue(true)
                                                    return Promise.resolve()
                                                })
                                        }).then(() => {
                                            return r.Admin().User().list({ownerId: u1.id})
                                                .then((res) => {
                                                    assert.equal(res.json.content.length, 0)
                                                    return Promise.resolve(res)
                                                })
                                        })
                                })
                        })
                    })
                })
            })
        })

        it('should allow read devices with app id', function () {
            return util.getRaptor().then(function (r) {
                return r.App().create({
                    name: util.randomName('app'),
                    roles: [{name: 'admin_device', permissions: ['admin_device']}],
                    users: []
                }).then((app) => {
                    // assert.equal(JSON.stringify(app), 1)
                    const user1 = util.newUser()
                    return r.Admin().User().create(user1).then((usr) => {
                        app.users.push({id:usr.id, role:['admin_device']})
                        return r.App().update(app).then(() => {
                            // assert.equal(JSON.stringify(app), 1)
                            return util.loginWithUser(user1.username, user1.password)
                                .then(function (userRaptor) {
                                    const u1 = userRaptor.Auth().getUser()
                                    const dev = {
                                        name: 'Robot',
                                        description: 'robotic device',
                                        domain: app.id
                                    }
                                    return r.Inventory().create(dev)
                                        .then(() => {
                                            return userRaptor.Inventory().list({domain: app.id})
                                                .then((res) => {
                                                    assert.equal(res.json.content.length, 0)
                                                    return Promise.resolve(dev)
                                                })
                                        })
                                        // .then((users) => {
                                        //     let query = {ownerId: u1.id, domain: app.id}
                                        //     return r.Admin().User().delete(users.json.content[0].id, query)
                                        //         .then(() => {
                                        //             // assert.isTrue(true)
                                        //             return Promise.resolve()
                                        //         })
                                        // }).then(() => {
                                        //     return r.Admin().User().list({ownerId: u1.id})
                                        //         .then((res) => {
                                        //             assert.equal(res.json.content.length, 0)
                                        //             return Promise.resolve(res)
                                        //         })
                                        // })
                                })
                        })
                    })
                })
            })
        })

    })
})
