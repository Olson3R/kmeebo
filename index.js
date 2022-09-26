const { Client, GatewayIntentBits } = require('discord.js')
const config = require('config')

const adminAddAdmin = require('./src/commands/admin-add-admin')
const adminRemoveAdmin = require('./src/commands/admin-remove-admin')
const adminRemoveChannel = require('./src/commands/admin-remove-channel')
const adminSetupChannel = require('./src/commands/admin-setup-channel')
const corporationLeaderboard = require('./src/commands/corporation-leaderboard')
const corporationStats = require('./src/commands/corporation-stats')
const killReportExport = require('./src/commands/kill-report-export')
const killReportShow = require('./src/commands/kill-report-show')
const pilotLeaderboard = require('./src/commands/pilot-leaderboard')
const pilotRegister = require('./src/commands/pilot-register')
const pilotStats = require('./src/commands/pilot-stats')
const userLeaderboard = require('./src/commands/user-leaderboard')

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

    if (subcommandName === 'add-admin') {
      await adminAddAdmin(interaction)
    }
    else if (subcommandName === 'remove-admin') {
      await adminRemoveAdmin(interaction)
    }
    else if (subcommandName === 'remove-channel') {
      await adminRemoveChannel(interaction)
    }
    else if (subcommandName === 'setup-channel') {
      await adminSetupChannel(interaction)
    }
  }
  else if (commandName === 'corporation') {
    const subcommandName = options.getSubcommand()

    if (subcommandName === 'leaderboard') {
      await corporationLeaderboard(interaction)
    }
    else if (subcommandName === 'stats') {
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

    if (subcommandName === 'leaderboard') {
      await pilotLeaderboard(interaction)
    }
    else if (subcommandName === 'register') {
      await pilotRegister(interaction)
    }
    else if (subcommandName === 'stats') {
      await pilotStats(interaction)
    }
  }
  else if (commandName === 'user') {
    const subcommandName = options.getSubcommand()

    if (subcommandName === 'leaderboard') {
      await userLeaderboard(interaction)
    }
  }
})

client.on('messageCreate', async message => {
  await killReportHandler(message)
})

// Login to Discord with your client's token
client.login(config.Discord.botToken)
