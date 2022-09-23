const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const config = require('config')
// const { clientId, token } = require('./config.json');

const commands = [
  // new SlashCommandBuilder().setName('admin').setDescription('Administration commands.')
  //   .addSubcommand(subcommand => subcommand.setName('setup-channel').setDescription('Setup up a channel for tracking kill reports.')
  //     .addStringOption(option => option.setName('kill-tag').setDescription('An optional tag to associate all kills with.'))
  //   )
  //   .addSubcommand(subcommand => subcommand.setName('remove-channel').setDescription('Remove a channel from tracking kill reports.')
  //     .addChannelOption(option => option.setName('channel').setDescription('The channel to stop processing kill reports for.'))
  //   ),

  new SlashCommandBuilder().setName('corporation').setDescription('Commands related to corporations.')
    .addSubcommand(subcommand => subcommand.setName('stats').setDescription('Show kills and losses for a corporation.')
      .addStringOption(option => option.setName('tag').setDescription('The Eve Echoes tag for the coropration.').setRequired(true))
    ),

  new SlashCommandBuilder().setName('kill-report').setDescription('Commands related to kill reports.')
    .addSubcommand(subcommand => subcommand.setName('export').setDescription('Export all kill reports to a CSV file.'))
    .addSubcommand(subcommand => subcommand.setName('show').setDescription('Show information for a kill report by id.')
      .addStringOption(option => option.setName('id').setDescription('The Kmeebo defined id for the kill report.').setRequired(true))
    ),

  new SlashCommandBuilder().setName('pilot').setDescription('Commands related to pilots.')
    .addSubcommand(subcommand => subcommand.setName('stats').setDescription('Show kills and losses for a pilot.')
      .addStringOption(option => option.setName('pilot').setDescription('The Eve Echoes pilot name.').setRequired(true))
    )
]
  .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.Discord.botToken);

rest.put(Routes.applicationCommands(config.Discord.clientId), { body: commands })
  .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
  .catch(console.error);
