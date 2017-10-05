'use strict'

const moment = require('moment-timezone')
const {setTimeout} = require('long-timeout')
const beers = require('./beers.json')

const TIMEZONE = process.env.TIMEZONE || 'Europe/Berlin'
const LOCALE = process.env.LOCALE || 'de-DE'

const onNewBeer = (cb) => {
	beers.forEach((beer) => {
		const when = moment.tz(beer.date, TIMEZONE)
		when.hours(10)
		const msLeft = when - Date.now()
		if (msLeft < 0) return

		setTimeout(() => cb(beer), msLeft, beer)
	})
}

module.exports = onNewBeer
