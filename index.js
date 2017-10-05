'use strict'

const Bot = require('node-telegram-bot-api')
const moment = require('moment-timezone')

const watching = require('./lib/watching')

const TOKEN = process.env.TOKEN
if (!TOKEN) {
	console.error('Missing TOKEN env var.')
	process.exit(1)
}

const TIMEZONE = process.env.TIMEZONE || 'Europe/Berlin'
const LOCALE = process.env.LOCALE || 'de-DE'

const startedMsg = `\
Okay! I werde dir bescheid sagen, wenn es ein neues Bier im Eschenbräu gibt.`
const stoppedMsg = `\
Okay, Message angekommen.`
const helpMsg = `\
Dieser Bot schreibt dir, wenn es im Eschenbräu ein neues Bier gibt.
Schicke \`/start\`, um ihn zu aktivieren, und \`/stop\` um ihn zu stoppen.`
const errMsg = `\
Shit! Irgendwas stimmt hier nicht. Bitte probier das noch mal.`

const bot = new Bot(TOKEN, {polling: true})

bot.on('message', (msg) => {
	if (!msg.text) return
	const user = msg.chat.id

	if (msg.text.slice(0, 6).toLowerCase() === '/start') {
		watching.add(user, (err) => {
			if (err) bot.sendMessage(user, errMsg)
			else bot.sendMessage(user, startedMsg)
		})
	} if (msg.text.slice(0, 5).toLowerCase() === '/stop') {
		watching.del(user, (err) => {
			if (err) bot.sendMessage(user, errMsg)
			else bot.sendMessage(user, stoppedMsg)
		})
	} else {
		bot.sendMessage(user, helpMsg)
	}
})
