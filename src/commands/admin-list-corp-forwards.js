const _ = require('lodash')

const colors = require('../color-util')
const { isAdmin } = require('../util')
const { AllowCorpForward } = require('../models')
const logger = require('../services/logger')

const adminListCorpForwards = async (interaction, client) => {
  const updatedBy = interaction.user.tag
  const guildId = interaction.guildId

  if (!(await isAdmin(guildId, interaction.member))) {
    const embed = {
      color: colors.red,
      title: 'Not An Admin',
      description: 'Admin permission is required for this command.'
    }
    await interaction.reply({ embeds: [embed] })
    return
  }

  try {
    const corpForwards = await AllowCorpForward.findAll({ where: { guildId }})

    const corpForwardList = _.map(corpForwards, corpForward => {
      const guildName = client.guilds.cache.get(corpForward.corpGuildId)
      const channelName = client.channels.cache.get(corpForward.forwardableChannelId) ?? `*UNKNWON CHANNEL ID ${corpForward.forwardableChannelId}*`
      return `${guildName} (${corpForward.corpGuildId}) can forward to ${channelName}`
    })

    const embed = {
      type: 'rich',
      color: colors.green,
      title: 'Corp Forwards',
      description: `Messages will be allowed from the corp guilds to the channels specified.\n${corpForwardList.join('\n')}`
    }
    await interaction.reply({ embeds: [embed], components: [], content: null })
  } catch (e) {
    logger.error(e)

    const embed = {
      color: colors.red,
      title: 'Error Configuring Corp Forwarding',
      description: e.message
    }
    await interaction.reply({ embeds: [embed], components: [], content: null })
  }
}

module.exports = adminListCorpForwards
