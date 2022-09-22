const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const config = require('config')
// const { clientId, token } = require('./config.json');

const commands = [
  new SlashCommandBuilder().setName('kill-report').setDescription('Commands related to kill reports.')
    .addSubcommand(subcommand => subcommand.setName('export').setDescription('Export all kill reports to a CSV file.'))
    .addSubcommand(subcommand => subcommand.setName('show').setDescription('Show information for a kill report by id.')
      .addStringOption(option => option.setName('id').setDescription('The Kmeebo defined id for the kill report.').setRequired(true))
    )
]
  .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.Discord.botToken);

rest.put(Routes.applicationCommands(config.Discord.clientId), { body: commands })
  .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
  .catch(console.error);
