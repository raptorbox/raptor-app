
const Raptor = require('raptor-sdk')

const l = module.exports

let r

l.client = () => r

l.initialize = (url, brokerUrl, credentials) => {
    r = new Raptor({
        url,
        mqttUrl: brokerUrl,
        username: credentials.username,
        password: credentials.password
    })
    return r.Auth().login()
        .then(() => {
            return r.Admin().Token().list()
                .then((tokens) => {
                    tokens = tokens ? tokens.getContent().filter((t) => t.name === credentials.tokenName) : []
                    if(tokens) {
                        return Promise.resolve(tokens[0])
                    }
                    return r.Admin().Token().create({
                        name: credentials.tokenName,
                        expires: 0,
                    })
                })
        })
        .then((token) => {
            credentials.token = token
            const cfg = r.getConfig()
            cfg.token = token.token
            cfg.username = cfg.password = null
            r.setConfig(cfg)
            return r.Auth().login()
        })
}
