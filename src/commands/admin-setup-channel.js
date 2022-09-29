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

    const perms = _.filter([
      {name: 'AddReactions', value: interaction.appPermissions.has(PermissionsBitField.Flags.AddReactions) },
      {name: 'ReadMessageHistory', value: interaction.appPermissions.has(PermissionsBitField.Flags.ReadMessageHistory) },
      {name: 'AttachFiles', value: interaction.appPermissions.has(PermissionsBitField.Flags.AttachFiles) },
      {name: 'CreatePrivateThreads', value: interaction.appPermissions.has(PermissionsBitField.Flags.CreatePrivateThreads) },
      {name: 'CreatePublicThreads', value: interaction.appPermissions.has(PermissionsBitField.Flags.CreatePublicThreads) },
      {name: 'EmbedLinks', value: interaction.appPermissions.has(PermissionsBitField.Flags.EmbedLinks) },
      {name: 'SendMessages', value: interaction.appPermissions.has(PermissionsBitField.Flags.SendMessages) },
      {name: 'SendMessagesInThreads', value: interaction.appPermissions.has(PermissionsBitField.Flags.SendMessagesInThreads) },
    ], { value: false }).map(p => p.name)
// logger.info('PERMSSS', { channel:  interaction.channel })
    const fields = [
      { name: 'Name', value: interaction.channel.name },
      { name: 'Id', value: channelId },
      { name: 'Kill Tag', value: killTag ?? '*None*' },
      { name: 'App Permission', value: interaction.appPermissions.toLocaleString() },
    ]
    if (perms.length > 0) fields.push({ name: 'Missing Channel Permissions', value: perms.join(', ') })

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
