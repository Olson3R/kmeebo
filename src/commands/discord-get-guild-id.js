const colors = require('../color-util')

const getDiscordGuildId = async (interaction) => {
  const guildId = interaction.guildId

  const embed = {
    color: colors.green,
    title: `Your Discord Guild ID is \`${guildId}\``,
    description: 'You can give this to your alliance KMEEBO admin to allow this Discord Guild to forward kill reports.'
  }

  await interaction.reply({ embeds: [embed] })
}

module.exports = getDiscordGuildId
