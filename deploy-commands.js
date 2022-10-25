const { SlashCommandBuilder, Routes } = require('discord.js')
const { REST } = require('@discordjs/rest')
const config = require('config')
// const { clientId, token } = require('./config.json');

const commands = [
  new SlashCommandBuilder().setName('admin').setDescription('Administration commands.')
    .addSubcommand(subcommand => subcommand.setName('add-admin').setDescription('Add an admin user.')
      .addUserOption(option => option.setName('user').setDescription('The user to give admin permissions to.').setRequired(true))
    )
    .addSubcommand(subcommand => subcommand.setName('allow-corp-forwarding').setDescription('Allow a corporation\'s guild to post messages to a channel.')
      .addStringOption(option => option.setName('corp-guild-id').setDescription('The id of the corporation\'s guild to allow messages from.').setRequired(true))
      .addChannelOption(option => option.setName('forwardable-channel').setDescription('The channel to allow messages to be forwarded to.').setRequired(true))
    )

    // .addSubcommand(subcommand => subcommand.setName('backfill-kill-reports').setDescription('Read channel message history to find past kill reports.'))

    .addSubcommand(subcommand => subcommand.setName('remove-corp-forwarding').setDescription('Remove a corporation\'s guild permission to post messages to a channel.')
      .addStringOption(option => option.setName('corp-guild-id').setDescription('The id of the corporation\'s guild to allow messages from.').setRequired(true))
      .addChannelOption(option => option.setName('forwardable-channel').setDescription('The channel to allow messages to be forwarded to.').setRequired(false))
    )
    .addSubcommand(subcommand => subcommand.setName('remove-admin').setDescription('Remove an admin user.')
      .addUserOption(option => option.setName('user').setDescription('The user to remove admin permissions from.').setRequired(true))
    )
    .addSubcommand(subcommand => subcommand.setName('kill-report-forwarding').setDescription('Configure kill report forwarding to an external channel.'))

    .addSubcommand(subcommand => subcommand.setName('setup-channel').setDescription('Setup up a channel for tracking kill reports.')
      .addStringOption(option => option.setName('kill-tag').setDescription('An optional tag to associate all kills with.'))
    )
    .addSubcommand(subcommand => subcommand.setName('remove-channel').setDescription('Remove a channel from tracking kill reports.')
      .addChannelOption(option => option.setName('channel').setDescription('The channel to stop processing kill reports for.'))
    ),

  new SlashCommandBuilder().setName('corporation').setDescription('Commands related to corporations.')
    .addSubcommand(subcommand => subcommand.setName('leaderboard').setDescription('Show corporation kill report isk leaders based on final blow.')
      .addStringOption(option => option.setName('period').setDescription('The timeframe for the leaderbaord report.')
        .addChoices({ name: 'Curent Month', value: 'current-month' })
        .addChoices({ name: 'Last Month', value: 'last-month' })
        .addChoices({ name: 'Lifetime', value: 'lifetime' })
      )
      .addStringOption(option => option.setName('kill-tag').setDescription('The kill tag to limit kill reports to.'))
    )
    .addSubcommand(subcommand => subcommand.setName('stats').setDescription('Show kill and loss stats for a corporation.')
      .addStringOption(option => option.setName('tag').setDescription('The Eve Echoes tag for the coropration.').setRequired(true))
    ),

  new SlashCommandBuilder().setName('kill-report').setDescription('Commands related to kill reports.')
    .addSubcommand(subcommand => subcommand.setName('export').setDescription('Export all kill reports to a CSV file.'))
    .addSubcommand(subcommand => subcommand.setName('show').setDescription('Show information for a kill report by id.')
      .addStringOption(option => option.setName('id').setDescription('The Kmeebo defined id for the kill report.').setRequired(true))
    ),

  new SlashCommandBuilder().setName('pilot').setDescription('Commands related to pilots.')
    .addSubcommand(subcommand => subcommand.setName('leaderboard').setDescription('Show pilot kill report isk leaders based on final blow.')
      .addStringOption(option => option.setName('period').setDescription('The timeframe for the leaderbaord report.')
        .addChoices({ name: 'Curent Month', value: 'current-month' })
        .addChoices({ name: 'Last Month', value: 'last-month' })
        .addChoices({ name: 'Lifetime', value: 'lifetime' })
      )
      .addStringOption(option => option.setName('kill-tag').setDescription('The kill tag to limit kill reports to.'))
    )
    .addSubcommand(subcommand => subcommand.setName('register').setDescription('Register your pilot names.')
      .addStringOption(option => option.setName('name').setDescription('The Eve Echoes pilot name.').setRequired(true))
    )
    .addSubcommand(subcommand => subcommand.setName('remove').setDescription('Remove a pilot.')
      .addStringOption(option => option.setName('name').setDescription('The name of the Eve Echoes pilot to remove.').setRequired(true))
    )
    .addSubcommand(subcommand => subcommand.setName('stats').setDescription('Show kill and loss stats for a pilot.')
      .addStringOption(option => option.setName('pilot').setDescription('The Eve Echoes pilot name.').setRequired(true))
    ),

  new SlashCommandBuilder().setName('user').setDescription('Commands related to users.')
    .addSubcommand(subcommand => subcommand.setName('leaderboard').setDescription('Show user kill report isk leaders based on final blow.')
      .addStringOption(option => option.setName('period').setDescription('The timeframe for the leaderbaord report.')
        .addChoices({ name: 'Curent Month', value: 'current-month' })
        .addChoices({ name: 'Last Month', value: 'last-month' })
        .addChoices({ name: 'Lifetime', value: 'lifetime' })
      )
      .addStringOption(option => option.setName('kill-tag').setDescription('The kill tag to limit kill reports to.'))
    )
    // .addSubcommand(subcommand => subcommand.setName('stats').setDescription('Show kill and loss stats for a user\'s pilots.'))
]
  .map(command => command.toJSON())

const rest = new REST({ version: '10' }).setToken(config.Discord.botToken)

rest.put(Routes.applicationCommands(config.Discord.clientId), { body: commands })
  .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
  .catch(console.error)
