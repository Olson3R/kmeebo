const { PermissionsBitField } = require('discord.js')
const _ = require('lodash')

const colors = require('../color-util')
const { isAdmin } = require('../util')
const { Channel } = require('../models')
const logger = require('../services/logger')

const adminSetupChannel = async (interaction) => {
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

  const channelId = interaction.channelId
  const killTag = interaction.options.getString('kill-tag')

  try {
    const channel = _.first(await Channel.findOrCreate({
      where: { guildId, channelId },
      defaults: { updatedBy, killTag }
    }))
    channel.updatedBy = updatedBy
    channel.killTag = killTag
    await channel.save()

    const missingPermissions = _.filter(
      [
        'AddReactions',
        'ReadMessageHistory',
        'AttachFiles',
        'CreatePrivateThreads',
        'CreatePublicThreads',
        'EmbedLinks',
        'SendMessages',
        'SendMessagesInThreads',
        // 'ManageChannels',
        // 'ManageEvents',
        // 'ManageGuild',
        // 'ManageMessages',
        'ViewChannel',
      ],
      perm => !interaction.appPermissions.has(PermissionsBitField.Flags[perm])
    )

    const fields = [
      { name: 'Name', value: interaction.channel.name },
      { name: 'Id', value: channelId },
      { name: 'Kill Tag', value: killTag ?? '*None*' }
    ]
    if (missingPermissions.length > 0) fields.push({ name: 'Missing Channel Permissions', value: missingPermissions.join(', ') })

    const ending = _.isNil(killTag) ? 'without a kill tag' : `with kill tag \`${killTag}\``
    const embed = {
      color: colors.green,
      title: 'Setup Channel For Processing Kill Reports!',
      description: `Kill reports will now be processed in this channel ${ending}.`,
      footer: { text: channel.id },
      fields
    }
    await interaction.reply({ embeds: [embed] })
  } catch (e) {
    const embed = {
      color: colors.red,
      title: 'Error Setting Up Channel For Processing Kill Reports',
      description: e.message
    }
    await interaction.reply({ embeds: [embed] })
  }
}

module.exports = adminSetupChannel
