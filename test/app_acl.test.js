
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
                            r, app, dev1, dev2, adm: u1, usr: u2, admId: u2id, usrId: u1id
                        })
                    })
                })
        })
    })
}

describe('app service', function () {

    this.timeout(999999)

    before(util.before)
    after(util.after)

    describe('App ACL API', function () {

        it('app users should respect app permission', function () {
            return createApp().then(({r, app, adm, usr, dev1, dev2, admId, usrId}) => {
                logger.debug('Check admin %s can read %s', admId, dev1.id)
                return adm.Inventory().read(dev1.id)
                    .then(() => {
                        logger.debug('Check usr %s can NOT read %s', usrId, dev1.id)
                        return usr.Inventory().read(dev1.id)
                            .then(() => Promise.reject(new Error('Should not read')))
                            .catch((e) => {
                                if (e.message === 'Access is denied') {
                                    return Promise.resolve()
                                }
                                return Promise.reject(e)
                            })
                    })
                    .then(() => {
                        logger.debug('Check usr %s can create device in app', usrId)
                        return usr.Inventory().create({
                            name: util.randomName('dev3'),
                            domain: app.id,
                        })
                    })
                    .then(() => {
                        logger.debug('Check usr %s can create device out of app', usrId)
                        return usr.Inventory().create({
                            name: util.randomName('dev4'),
                        }).catch((e) => {
                            console.warn(e)
                            return Promise.resolve()
                        })
                    })
            })
        })

        /**
        Expected beahviours
         - admin1 can access app1, app2
         - admin2 can not access app1 but app2

         Structure:
            parent app1
                - device1a, device1b
                - adm1, usr1
                - app2
                    - device2a, device2b
                    - adm2, usr2
        */

        it('app hierarchy permissions', function () {
            return Promise.all([createApp(), createApp()])
                .then((ops) => {
                    // {r, app, adm, usr, dev1, dev2, admId, usrId}
                    const parent = ops[0],
                        child = ops[1]
                    child.app.domain = parent.app.id
                    return parent.r.App().update(child.app).then(() =>
                        Promise.resolve({parent, child}))
                })
                .then((set) => {

                    const parentAdm = set.parent.adm,
                        parentDev = set.parent.dev1

                    const childUsr = set.child.usr,
                        childDev = set.child.dev1

                    logger.debug('Check parent admin %s can read child app device %s', set.parent.admId, childDev.id)
                    return parentAdm.Inventory().read(childDev.id)
                        .then(() => {
                            logger.debug('Check child usr %s can NOT read parent app device %s', set.child.usrId, parentDev.id)
                            return childUsr.Inventory().read(parentDev.id)
                                .then(() => Promise.reject(new Error('Should not read')))
                                .catch((e) => {
                                    if (e.message === 'Access is denied') {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(e)
                                })
                        })
                        // .then(() => {
                        //     logger.debug('Check usr %s can create device in app', usrId)
                        //     return usr.Inventory().create({
                        //         name: util.randomName('dev3'),
                        //         domain: app.id,
                        //     })
                        // })
                        // .then(() => {
                        //     logger.debug('Check usr %s can create device out of app', usrId)
                        //     return usr.Inventory().create({
                        //         name: util.randomName('dev4'),
                        //     }).catch((e) => {
                        //         console.warn(e)
                        //         return Promise.resolve()
                        //     })
                        // })
                })
        })


    })
})
