'use strict'

const path = require('path')
const level = require('level')

const p = path.join(__dirname, '..', process.env.DB || 'eschen-bot.ldb')
const db = level(p)

const add = (user, cb) => {
	db.put(user, Date.now(), cb)
}

const del = (user, cb) => {
	db.del(user, cb)
}

const all = () => {
	return db.createKeyStream()
}

module.exports = {add, del, all}
