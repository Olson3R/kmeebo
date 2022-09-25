const axios = require('axios')
const { Client, GatewayIntentBits, SystemChannelFlagsBitField } = require('discord.js')
const config = require('config')
const _ = require('lodash')

const parseKillReport = require('./src/services/kill-report-parser')

const IMAGE_CONTENT_TYPE = /^image\//

const getImageAttachment = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer'})
  return Buffer.from(response.data, 'binary')
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

// When the client is ready, run this code (only once)
client.once('ready', async () => {
  console.log(`Starting backfill for channel id ${process.argv[2]}!`)

  const channel = client.channels.cache.get(process.argv[2]);
  console.log(`Channel ${channel.name}`)

  let messageId = null
  let messages = await channel.messages.fetch({ limit: 100 })
  while (messages.size > 0) {
    console.log(`Received ${messages.size} messages`);
    for (const message of messages.values()) {
      messageId = message.id

      if (message.attachments.size === 0) continue

      const images = []
      for (const attachment of message.attachments.values()) {
        if (!IMAGE_CONTENT_TYPE.test(attachment.contentType)) continue
        images.push(attachment)
      }
      if (images.length === 0) continue

      const myReactions = message.reactions.cache.filter(reaction => reaction.me)
      if (myReactions.size > 0) continue

      console.log(`Processing message ${message.id}`)
      const killReports = []
      for (const attachment of message.attachments.values()) {
        console.log(`\timage attachment: ${attachment.contentType} - ${attachment.url}`)

        const guildId = message.guildId
        const submittedBy = message.author.tag
        const imageData = await getImageAttachment(attachment.url)

        try {
          const killReport = await parseKillReport(guildId, submittedBy, attachment.name, imageData, { url: attachment.url })
          killReports.push(killReport)
        }
        catch(e) {
          console.error(e)
          message.react('❌')
        }
      }

      if (killReports.length === 0) continue

      const status = _.chain(killReports)
        .map(km => km.duplicate ? 'DUPLICATE' : km.status)
        .reduce(
          (result, km) => {
            if (result === 'ERROR' || km === 'ERROR') return 'ERROR'
            if (result === 'DUPLICATE' || km === 'DUPLICATE') return 'DUPLICATE'
            return 'SUCCESS'
          },
          'SUCCESS'
        )
        .value()
      if (status === 'DUPLICATE') {
        await message.react('©️')
      }
      if (status === 'ERROR') {
        await message.react('❌')
      }
      else {
        await message.react('✅')
      }
    }
    messages = await channel.messages.fetch({ before: messageId, limit: 100 })
  }

  process.exit(0)
})

// Login to Discord with your client's token
client.login(config.Discord.botToken)
