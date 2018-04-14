'use strict'

const {createHash} = require('crypto')
const Bot = require('telegraf')
const url = require('url')
const escape = require('js-string-escape')
const through = require('through2')

const beers = require('./lib/beers.json')
const watching = require('./lib/watching')
const onNewBeer = require('./lib/on-new-beer')

const TOKEN = process.env.TOKEN
if (!TOKEN) {
	console.error('Missing TOKEN env var.')
	process.exit(1)
}

const sha1 = (str) => {
	const hash = createHash('sha1')
	hash.update(str)
	return hash.digest('hex')
}

const logErr = (err) => {
	if (process.env.NODE_ENV === 'dev') console.error(err)
	else console.error(err && err.message || (err + ''))
}

const startedMsg = `\
Okay! I werde dir bescheid sagen, wenn es ein neues Bier im Eschenbräu gibt. 😋`
const stoppedMsg = `\
Okay, Message angekommen.`
const helpMsg = `\
Dieser Bot schreibt dir, wenn es im Eschenbräu ein neues Bier gibt.
Schicke \`/start\`, um ihn zu aktivieren, und \`/stop\` um ihn zu stoppen.

> Wir befinden uns im 3. Jahrtausend n.Chr. In ganz Germania herrschen Bierriesen über den Durst des Volkes. In ganz Germania? Nein! Eine von einem unbeugsamen Braumeister betriebene Brauerei hört nicht auf, dem Einheitsgeschmack der Bierriesen Widerstand zu leisten. In einem kleinen Keller in Wedding braut er nach geheimen Rezepten Sud für Sud Bierspezialitäten, die dem Biergenießer enormes Wohlbefinden bescheren.`
const errMsg = `\
Shit! Irgendwas stimmt hier nicht. Bitte probier das noch mal.`

const beerMsg = (beer) => {
	let str = `\
Ab heute kannst du im Eschenbräu ein *${beer.name}* genießen! 🍻\n`
	if (beer.description) str += `\n> ${beer.description}\n`
	if (beer.gravity) str += `\n${beer.gravity} Stammwürze`
	if (beer.alcohol) str += `\n${beer.alcohol}% Alkohol`
	return str
}

const listMsg = beers.map(b => `\`${b.date}\` ${b.name}\n`).join('')

const bot = new Bot(TOKEN)

bot.use(async (ctx, next) => {
	if (!ctx.chat || !ctx.chat.id) return null
	ctx.user = ctx.chat.id

	const t0 = Date.now()
	await next(ctx)
	const d = Date.now() - t0

	const msg = ctx.message
	console.info([
		d + 'ms',
		msg && msg.date || '[unknown date]',
		ctx.user,
		(
			msg && msg.text && escape(msg.text.slice(0, 30)) || '[no message]'
		)
	].join(' '))
})

bot.command('/list', (ctx) => {
	return ctx.replyWithMarkdown(listMsg)
})
bot.command('/start', async (ctx) => {
	try {
		await watching.add(ctx.user)
		await ctx.replyWithMarkdown(startedMsg)
	} catch (err) {
		logErr(err)
		await ctx.replyWithMarkdown(errMsg)
	}
})
bot.command('/stop', async (ctx) => {
	try {
		await watching.del(ctx.user)
		await ctx.replyWithMarkdown(stoppedMsg)
	} catch (err) {
		logErr(err)
		await ctx.replyWithMarkdown(errMsg)
	}
})
bot.use((ctx) => {
	return ctx.replyWithMarkdown(helpMsg)
})

onNewBeer((beer) => {
	const msg = beerMsg(beer)
	let receivers = 0

	watching.all()
	.pipe(through.obj((user, _, cb) => {
		receivers++
		bot.telegram.sendMessage(user, msg, {parse_mode: 'Markdown'})
		.then(() => cb())
		.catch(cb)
	}))
	.once('finish', () => {
		console.info(`Notified ${receivers} people about ${beer.name}.`)
	})
	.once('error', logErr)
})

if (process.env.NODE_ENV === 'dev') {
	console.info('using polling')

	bot.telegram.deleteWebhook()
	.then(() => bot.startPolling())
	.catch(logErr)
} else {
	console.info('using web hook')

	const WEB_HOOK_HOST = process.env.WEB_HOOK_HOST
	if (!WEB_HOOK_HOST) {
		console.error('Missing WEB_HOOK_HOST env var.')
		process.exit(1)
	}
	const WEB_HOOK_PATH = process.env.WEB_HOOK_PATH
	if (!WEB_HOOK_PATH) {
		console.error('Missing WEB_HOOK_PATH env var.')
		process.exit(1)
	}
	const WEB_HOOK_PORT = process.env.WEB_HOOK_PORT && parseInt(process.env.WEB_HOOK_PORT)
	if (!WEB_HOOK_PORT) {
		console.error('Missing WEB_HOOK_PORT env var.')
		process.exit(1)
	}

	bot.webhookReply = false
	bot.telegram.setWebhook(url.format({
		protocol: 'https',
		host: WEB_HOOK_HOST,
		pathname: WEB_HOOK_PATH
	}))
	bot.startWebhook(WEB_HOOK_PATH, null, WEB_HOOK_PORT)
}

bot.catch(console.error)
