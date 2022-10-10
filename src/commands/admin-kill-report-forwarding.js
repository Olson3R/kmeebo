const { SelectMenuBuilder, ActionRowBuilder } = require('discord.js')
const _ = require('lodash')

const colors = require('../color-util')
const { isAdmin } = require('../util')
const { AllowCorpForward, Channel } = require('../models')
const logger = require('../services/logger')

const adminKillReportForwarding = async (interaction, client) => {
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

  const corpForwards = await AllowCorpForward.findAll({ where: { corpGuildId: guildId }})
  const channelOptions = _.compact(corpForwards.map(corpForward => {
    const channel = client.channels.cache.get(corpForward.forwardableChannelId)
    if (!channel) return null
    return {
      label: channel.name,
      description: channel.guild.name,
      value: channel.id
    }
  }))
  const forwardToChannelInput = new ActionRowBuilder()
    .addComponents(
      new SelectMenuBuilder()
        .setCustomId('forwardToChannelId')
        .setPlaceholder('External channel to forward kill reports to')
        // .setRequired(false)
        .addOptions(
          {
            label: 'None',
            description: 'Don\'t forward kill reports.',
            value: 'none'
          },
          ...channelOptions
        )
    )

  await interaction.reply({ content: 'Select the channel for kill report forwarding.', components: [forwardToChannelInput], ephemeral: true })
}

const adminKillReportForwardingSubmit = async (interaction, client) => {
  const updatedBy = interaction.user.tag
  const guildId = interaction.guildId

  if (!(await isAdmin(guildId, interaction.member))) {
    const embed = {
      color: colors.red,
      title: 'Not An Admin',
      description: 'Admin permission is required for this command.'
    }
    await interaction.update({ embeds: [embed] })
    return
  }

  const channelId = interaction.channelId
  const value = _.first(interaction.values)
  const forwardToChannelId = value === 'none' ? null : value
  console.log('FFFFF', forwardToChannelId, value)
  const forwardToChannel = client.channels.cache.get(forwardToChannelId)

  try {
    await interaction.update({ content: 'Saving...', components: [] })

    const channel = _.first(await Channel.findOrCreate({
      where: { guildId, channelId },
      defaults: { updatedBy, forwardToChannelId }
    }))
    channel.updatedBy = updatedBy
    channel.forwardToChannelId = forwardToChannelId
    await channel.save()

    const fields = [
      { name: 'Source Channel', value: interaction.channel.name },
      { name: 'Forward To Channel Guild', value: forwardToChannel?.guild?.name ?? '*None*' },
      { name: 'Forward To Channel', value: forwardToChannel?.name ?? '*None*' }
    ]

    const embed = {
      type: 'rich',
      color: colors.green,
      title: `Kill Report Forwarding ${forwardToChannelId ? 'Enabled' : 'Disabled'}`,
      description: `Kill reports will ${forwardToChannelId ? 'now' : 'not'} be forwarded from this channel.`,
      footer: { text: channel.id },
      fields
    }
    await interaction.channel.send({ embeds: [embed], components: [], content: null })
  } catch (e) {
    logger.error(e)

    const embed = {
      color: colors.red,
      title: 'Error Configuring Kill Report Forwarding',
      description: e.message
    }
    await interaction.channel.send({ embeds: [embed], components: [], content: null })
  }
}

module.exports = { adminKillReportForwarding, adminKillReportForwardingSubmit }
