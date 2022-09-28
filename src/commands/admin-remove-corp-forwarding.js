const _ = require('lodash')

const colors = require('../color-util')
const { isAdmin } = require('../util')
const { AllowCorpForward, Channel } = require('../models')
const logger = require('../services/logger')

const adminRemoveCorpForwarding = async (interaction, client) => {
  const updatedBy = interaction.user.tag
  const guildId = interaction.guildId

  if (!(await isAdmin(guildId, updatedBy))) {
    const embed = {
      color: colors.red,
      title: 'Not An Admin',
      description: 'Admin permission is required for this command.'
    }
    await interaction.reply({ embeds: [embed] })
    return
  }
  const corpGuildId = interaction.options.getString('corp-guild-id')
  const forwardableChannel = interaction.options.getChannel('forwardable-channel')

  try {
    const where = { guildId, corpGuildId }
    if (forwardableChannel) {
      where.forwardableChannelId = forwardableChannel.id
    }
    const allToRemove = await AllowCorpForward.findAll({ where })
    for (const toRemove of allToRemove) {
      const channelWhere = { guildId: toRemove.corpGuildId, forwardToChannelId: toRemove.forwardableChannelId }
      const channelStats = await Channel.update({ forwardToChannelId: null }, { where: channelWhere })
      console.log('UPDATE CHAN', channelStats)
      await toRemove.destroy()
    }

    const corpGuild = client.guilds.cache.get(corpGuildId)

    const fields = [
      { name: 'Forwardable Channel', value: forwardableChannel?.name ?? `*${allToRemove.length.toLocaleString()} channel(s)*` },
      { name: 'Corp Guild Id', value: corpGuildId },
      { name: 'Corp Guild', value: corpGuild?.name ?? '*Bot may not have access*' }
    ]

    const embed = {
      type: 'rich',
      color: colors.green,
      title: 'Corp Forwarding Removed',
      description: 'Messages will not be allowed from the corps guild to the channel(s) anymore.',
      fields
    }
    await interaction.reply({ embeds: [embed], components: [], content: null })
  } catch (e) {
    logger.error(e)

    const embed = {
      color: colors.red,
      title: 'Error Removing Corp Forwarding',
      description: e.message
    }
    await interaction.reply({ embeds: [embed], components: [], content: null })
  }
}

module.exports = adminRemoveCorpForwarding
