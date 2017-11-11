
const Raptor = require('raptor-sdk')

const l = module.exports

let r

l.client = () => r

l.initialize = (url, credentials) => {
    r = new Raptor({
        url: url,
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
            r.setConfig({ url, token: token.token })
            return r.Auth().login()
        })
}
