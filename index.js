const { Client, GatewayIntentBits } = require('discord.js')
const config = require('config')

const adminAddUserRole = require('./src/commands/admin-add-user-role')
const adminAllowCorpForwarding = require('./src/commands/admin-allow-corp-forwarding')
const adminBackfillKillReports = require('./src/commands/admin-backfill-kill-reports')
const adminFindPastKillReports = require('./src/commands/admin-find-past-kill-reports')
const { adminKillReportForwarding, adminKillReportForwardingSubmit } = require('./src/commands/admin-kill-report-forwarding')
const adminListCorpForwards = require('./src/commands/admin-list-corp-forwards')
const adminRemoveCorpForwarding = require('./src/commands/admin-remove-corp-forwarding')
const adminRemoveAdmin = require('./src/commands/admin-remove-admin')
const adminRemoveChannel = require('./src/commands/admin-remove-channel')
const adminSetupChannel = require('./src/commands/admin-setup-channel')
const corporationLeaderboard = require('./src/commands/corporation-leaderboard')
const corporationStats = require('./src/commands/corporation-stats')
const getDiscordGuildId = require('./src/commands/discord-get-guild-id')
const killReportEdit = require('./src/commands/kill-report-edit')
const killReportExport = require('./src/commands/kill-report-export')
const killReportShow = require('./src/commands/kill-report-show')
const killReportStats = require('./src/commands/kill-report-stats')
const pilotLeaderboard = require('./src/commands/pilot-leaderboard')
const pilotRegister = require('./src/commands/pilot-register')
const pilotStats = require('./src/commands/pilot-stats')
const userLeaderboard = require('./src/commands/user-leaderboard')
const userStats = require('./src/commands/user-stats')

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
        'add-user-role': adminAddUserRole,
        'allow-corp-forwarding': adminAllowCorpForwarding,
        'backfill-kill-reports': adminBackfillKillReports,
        'find-past-kill-reports': adminFindPastKillReports,
        'kill-report-forwarding': adminKillReportForwarding,
        'list-corp-forwards': adminListCorpForwards,
        'remove-admin': adminRemoveAdmin,
        'remove-channel': adminRemoveChannel,
        'remove-corp-forwarding': adminRemoveCorpForwarding,
        'setup-channel': adminSetupChannel
      },
      corporation: {
        leaderboard: corporationLeaderboard,
        stats: corporationStats
      },
      discord: {
        'get-guild-id': getDiscordGuildId
      },
      'kill-report': {
        edit: killReportEdit,
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
        leaderboard: userLeaderboard,
        stats: userStats
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
