'use strict'

const path = require('path')
const level = require('level')
const pify = require('pify')

const p = path.join(__dirname, '..', process.env.DB || 'eschen-bot.ldb')
const db = level(p)

const pPut = pify(db.put.bind(db))
const add = user => pPut(user, Date.now())

const pDel = pify(db.del.bind(db))
const del = user => pDel(user)

const all = () => {
	return db.createKeyStream()
}

module.exports = {add, del, all}
