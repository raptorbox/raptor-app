
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Role = require('./app_role')
const AppUser = require('./app_user')
const uuidv4 = require('uuid/v4')

var App = new Schema({
    id: {
        type: String,
        index: true,
        required: false,
        unique: true,
        default: uuidv4
    },
    name: {
        type: String,
        index: true,
        required: true,
    },
    enabled: {
        type: Boolean,
        default: true,
        required: true,
    },
    userId: {
        type: String,
        index: true,
        required: true,
    },
    roles: {
        type: [Role.schema],
    },
    users: {
        type: [AppUser.schema]
    }
}, {
    toJSON: {
        transform: function (doc, ret) {
            delete ret._id
            delete ret.__v
        }
    }
})

// App.plugin(require('raptor-auth/model/plugin/pager'))

App.methods.isOwner = function(user) {
    return this.userId === user.id
}

App.methods.merge = function(t) {
    const app = this
    return Promise.resolve()
        .then(() => {

            if (t.name) {
                app.name = t.name
            }
            if (t.userId) {
                app.userId = t.userId
            }

            if (t.enabled !== undefined && t.enabled !== null) {
                app.enabled = t.enabled
            }

            return Promise.resolve()
        })
        .then(() => Promise.resolve(app))
}

App.pre('save', function(next) {
    if(!this.id) {
        this.id = uuidv4()
    }
    next()
})

module.exports = mongoose.model('App', App)
