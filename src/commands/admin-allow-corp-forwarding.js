const _ = require('lodash')

const colors = require('../color-util')
const { isAdmin } = require('../util')
const { AllowCorpForward } = require('../models')
const logger = require('../services/logger')

const adminAllowCorpForwarding = async (interaction, client) => {
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
  const forwardableChannel = interaction.options.getChannel('forwardable-channel')
  const corpGuildId = interaction.options.getString('corp-guild-id')

  try {
    const allowCorpForward = _.first(await AllowCorpForward.findOrCreate({
      where: { guildId, forwardableChannelId: forwardableChannel.id, corpGuildId },
      defaults: { updatedBy }
    }))
    allowCorpForward.updatedBy = updatedBy
    await allowCorpForward.save()

    const corpGuild = client.guilds.cache.get(corpGuildId)

    const fields = [
      { name: 'Forwardable Channel', value: forwardableChannel.name },
      { name: 'Corp Guild Id', value: corpGuildId },
      { name: 'Corp Guild', value: corpGuild?.name ?? '*Bot may not have access*' }
    ]

    const embed = {
      type: 'rich',
      color: colors.green,
      title: 'Corp Forwarding Enabled',
      description: 'Messages will be allowed from the corps guild to the channel specified.',
      footer: { text: allowCorpForward.id },
      fields
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

module.exports = adminAllowCorpForwarding
