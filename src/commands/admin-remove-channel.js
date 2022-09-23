const { DateTime } = require('luxon')
const _ = require('lodash')

const colors = require('../color-util')
const { Channel } = require('../models')

const adminRemoveChannel = async (interaction) => {
  const guildId = interaction.guildId
  const channel = interaction.options.getChannel('channel') ?? interaction.channel
  const channelId = channel.id

  try {
    const channelToRemove = await Channel.findOne({ where: { guildId, channelId }})
    if (channelToRemove) {
      await channelToRemove.destroy()

      const embed = {
        color: colors.green,
        title: 'Removed Channel',
        description: `Kill reports will no longer be processed in channel \`${channel.name}\`.`,
        footer: { text: channelToRemove.id }
      }
      await interaction.reply({ embeds: [embed] })
    }
    else {
      const embed = {
        color: colors.green,
        title: 'Channel Not Tracked',
        description: `Kill reports are not being processed in channel \`${channel.name}\`.`
      }
      await interaction.reply({ embeds: [embed] })
    }
  }
  catch(e) {
    const embed = {
      color: colors.red,
      title: 'Error Removing Channel',
      description: e.message
    }
    await interaction.reply({ embeds: [embed] })
  }
}

module.exports = adminRemoveChannel
