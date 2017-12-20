
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
                roles: [
                    {name: 'admin', permissions: ['admin']},
                    {name: 'user', permissions: ['admin_own_device']},
                ],
                users: [
                    { id: u1id, roles: ['admin'] },
                    { id: u2id, roles: ['user'] },
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
                        assert.equal(2, app.roles.length)

                        return Promise.resolve({
                            r, app, dev1, dev2, u1, u2, u2id, u1id
                        })
                    })
                })
        })
    })
}

describe('app service', function () {

    before(util.before)
    after(util.after)

    describe('App ACL API', function () {

        it('app user should read', function () {
            return createApp().then(({r, u1, u2, dev1, dev2}) => {
                const adm = u1, usr = u2
                return adm.Inventory().read(dev1.id).then(() =>
                    usr.Inventory().read(dev1.id)
                        .then(() => Promise.reject(new Error('Should not read')))
                        .catch((e) => {
                            console.warn(e)
                            if (e.status === 403) {
                                return Promise.resolve()
                            }
                            return Promise.reject(e)
                        })
                )
            })
        })

    })
})
