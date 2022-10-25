const { Client, GatewayIntentBits } = require('discord.js')
const config = require('config')

const adminAddAdmin = require('./src/commands/admin-add-admin')
const adminAllowCorpForwarding = require('./src/commands/admin-allow-corp-forwarding')
const adminBackfillKillReports = require('./src/commands/admin-backfill-kill-reports')
const adminRemoveCorpForwarding = require('./src/commands/admin-remove-corp-forwarding')
const { adminKillReportForwarding, adminKillReportForwardingSubmit } = require('./src/commands/admin-kill-report-forwarding')
const adminRemoveAdmin = require('./src/commands/admin-remove-admin')
const adminRemoveChannel = require('./src/commands/admin-remove-channel')
const adminSetupChannel = require('./src/commands/admin-setup-channel')
const corporationLeaderboard = require('./src/commands/corporation-leaderboard')
const corporationStats = require('./src/commands/corporation-stats')
const killReportExport = require('./src/commands/kill-report-export')
const killReportShow = require('./src/commands/kill-report-show')
const killReportStats = require('./src/commands/kill-report-stats')
const pilotLeaderboard = require('./src/commands/pilot-leaderboard')
const pilotRegister = require('./src/commands/pilot-register')
const pilotStats = require('./src/commands/pilot-stats')
const userLeaderboard = require('./src/commands/user-leaderboard')

const { killReportHandler } = require('./src/handlers/kill-report-handler')
const { backfillKillReportsHandler } = require('./src/handlers/backfill-kill-reports-handler')
const logger = require('./src/services/logger')

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
  setImmediate(() => { backfillKillReportsHandler(client) })
})

client.on('interactionCreate', async interaction => {
  logger.info(`MMMMM ${interaction.user.tag} in #${interaction.channel.name} created a interaction.`, { interaction })
  if (interaction.isChatInputCommand()) {
    console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`, interaction.options.getSubcommand())

    const { commandName, options } = interaction
    const subCommandName = options.getSubcommand()

    const commandMapping = {
      admin: {
        'add-admin': adminAddAdmin,
        'allow-corp-forwarding': adminAllowCorpForwarding,
        'backfill-kill-reports': adminBackfillKillReports,
        'kill-report-forwarding': adminKillReportForwarding,
        'remove-admin': adminRemoveAdmin,
        'remove-channel': adminRemoveChannel,
        'remove-corp-forwarding': adminRemoveCorpForwarding,
        'setup-channel': adminSetupChannel
      },
      corporation: {
        leaderboard: corporationLeaderboard,
        stats: corporationStats
      },
      'kill-report': {
        export: killReportExport,
        show: killReportShow,
        stats: killReportStats
      },
      pilot: {
        leaderboard: pilotLeaderboard,
        register: pilotRegister,
        stats: pilotStats
      },
      user: {
        leaderboard: userLeaderboard
      }
    }

    if (commandName && subCommandName) {
      await commandMapping[commandName][subCommandName](interaction, client)
    } else {
      await commandMapping[commandName](interaction, client)
    }
  }
  // else if (interaction.isModalSubmit()) {
  //   const { customId } = interaction

  //   const mapping = {}

  //   mapping[customId] && await mapping[customId](interaction)
  // }
  else if (interaction.isSelectMenu()) {
    const { customId } = interaction

    const selectMenuMapping = {
      forwardToChannelId: adminKillReportForwardingSubmit
    }

    await selectMenuMapping[customId](interaction, client)
  }
})

client.on('messageCreate', async message => {
  await killReportHandler(message, client)
})

// Login to Discord with your client's token
client.login(config.Discord.botToken)
