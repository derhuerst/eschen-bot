'use strict'

const Bot = require('node-telegram-bot-api')

const watching = require('./lib/watching')
const onNewBeer = require('./lib/on-new-beer')

const TOKEN = process.env.TOKEN
if (!TOKEN) {
	console.error('Missing TOKEN env var.')
	process.exit(1)
}

const startedMsg = `\
Okay! I werde dir bescheid sagen, wenn es ein neues Bier im Eschenbräu gibt. 😋`
const stoppedMsg = `\
Okay, Message angekommen.`
const helpMsg = `\
Dieser Bot schreibt dir, wenn es im Eschenbräu ein neues Bier gibt.
Schicke \`/start\`, um ihn zu aktivieren, und \`/stop\` um ihn zu stoppen.`
const errMsg = `\
Shit! Irgendwas stimmt hier nicht. Bitte probier das noch mal.`
const beerMsg = (beer) => `\
Ab heute kannst du im Eschenbräu ein *${beer.name}* genießen! 🍻`

const bot = new Bot(TOKEN, {polling: true})
const withMarkdown = {parse_mode: 'Markdown'}

bot.on('message', (msg) => {
	if (!msg.text) return
	const user = msg.chat.id

	if (msg.text.slice(0, 6).toLowerCase() === '/start') {
		watching.add(user, (err) => {
			if (err) bot.sendMessage(user, errMsg, withMarkdown)
			else bot.sendMessage(user, startedMsg, withMarkdown)
		})
	} else if (msg.text.slice(0, 5).toLowerCase() === '/stop') {
		watching.del(user, (err) => {
			if (err) bot.sendMessage(user, errMsg, withMarkdown)
			else bot.sendMessage(user, stoppedMsg, withMarkdown)
		})
	} else {
		bot.sendMessage(user, helpMsg, withMarkdown)
	}
})

onNewBeer((beer) => {
	const msg = beerMsg(beer)
	let receivers = 0

	watching.all()
	.on('data', (user) => {
		bot.sendMessage(user, msg, withMarkdown)
		receivers++
	})
	.once('end', () => {
		console.info(`Notified ${receivers} people about ${beer.name}.`)
	})
	.once('error', console.error)
})
