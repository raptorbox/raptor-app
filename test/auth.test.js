
const assert = require('chai').assert
const util = require('./util')
const logger = require('../logger')

describe('app service', function () {

    before(util.before)
    after(util.after)

    describe('App API', function () {

        it('should fail app read', function () {
            return util.createUserInstance().then((usr1) => {
                usr1.setConfig({
                    url: usr1.getConfig(),
                    token: '42'
                })
                return usr1.App().read({ id: 'foo' })
                    .catch((e) => {
                        assert.equal(401, e.code)
                        return Promise.resolve()
                    })
            })
        })

        it('should read app', function () {

            return util.getRaptor().then((r) => {
                return util.createUserInstance().then((usr1) => {
                    const usr1Id = usr1.Auth().getUser().id
                    const rawdev = { name: util.randomName('dev') }
                    return r.Inventory().create(rawdev).then((dev) => {
                        return r.App().create({
                            name: util.randomName('app'),
                            users: [ {
                                id: usr1Id,
                                role: [ 'operator' ]
                            } ],
                            devices: [dev.id],
                            roles: [{
                                name: 'operator',
                                permissions: [
                                    'read_device',
                                    'read_own_device',
                                ]
                            }]
                        }).then((app) => {
                            logger.debug('Created app %s', app.name)
                            return usr1.App().read(app).then((app) => {
                                return Promise.resolve()
                            })
                        })
                    })
                })
            })
        })

    })
})
