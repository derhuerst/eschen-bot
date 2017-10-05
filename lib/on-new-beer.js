'use strict'

const moment = require('moment-timezone')
const {setTimeout} = require('long-timeout')

const TIMEZONE = process.env.TIMEZONE || 'Europe/Berlin'
const LOCALE = process.env.LOCALE || 'de-DE'

const beers = [
	{name: 'Doppelhopf', date: '2017-10-06'}
	// todo: finish list, move to file
]

for (let beer of beers) {
	const when = moment.tz(beer.date, TIMEZONE)
	when.hours(10)
	beer.when = +when
}

const onNewBeer = (cb) => {
	beers.forEach((beer) => {
		const msLeft = beer.when - Date.now()
		if (msLeft < 0) return

		setTimeout(() => cb(beer), msLeft, beer)
	})
}

module.exports = onNewBeer
