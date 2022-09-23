const { Client, GatewayIntentBits } = require('discord.js')
const config = require('config')

const adminRemoveChannel = require('./src/commands/admin-remove-channel')
const adminSetupChannel = require('./src/commands/admin-setup-channel')
const corporationStats = require('./src/commands/corporation-stats')
const killReportExport = require('./src/commands/kill-report-export')
const killReportShow = require('./src/commands/kill-report-show')
const pilotStats = require('./src/commands/pilot-stats')

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
  if (!interaction.isChatInputCommand()) return

  console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`, interaction.options.getSubcommand())

  const { commandName, options } = interaction

  if (commandName === 'admin') {
    const subcommandName = options.getSubcommand()

    if (subcommandName === 'remove-channel') {
      await adminRemoveChannel(interaction)
    }
    else if (subcommandName === 'setup-channel') {
      await adminSetupChannel(interaction)
    }
  }
  else if (commandName === 'corporation') {
    const subcommandName = options.getSubcommand()

    if (subcommandName === 'stats') {
      await corporationStats(interaction)
    }
  }
  else if (commandName === 'kill-report') {
    const subcommandName = options.getSubcommand()

    if (subcommandName === 'export') {
      await killReportExport(interaction)
    }
    else if (subcommandName === 'show') {
      await killReportShow(interaction)
    }
  }
  else if (commandName === 'pilot') {
    const subcommandName = options.getSubcommand()

    if (subcommandName === 'stats') {
      await pilotStats(interaction)
    }
  }
})

client.on('messageCreate', async message => {
  await killReportHandler(message)
})

// Login to Discord with your client's token
client.login(config.Discord.botToken)
