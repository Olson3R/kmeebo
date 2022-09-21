const { Client, GatewayIntentBits } = require('discord.js')
const config = require('config')

const { killReportHandler } = require('./src/handlers/kill-report-handler')

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

// When the client is ready, run this code (only once)
client.once('ready', () => {
  console.log('Ready!')
})

client.on('interactionCreate', async interaction => {
  console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`)
})

client.on('messageCreate', async message => {
  await killReportHandler(message)
})

// Login to Discord with your client's token
client.login(config.Discord.botToken)
