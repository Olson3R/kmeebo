const _ = require('lodash')

const colors = require('../color-util')
const { isAdmin, formatNumber } = require('../util')
const { BackfillMessage, sequelize } = require('../models')
const logger = require('../services/logger')

const IMAGE_CONTENT_TYPE = /^image\//

const adminFindPastKillReports = async (interaction, client) => {
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

  const embed = {
    color: colors.green,
    title: 'Finding Past Kill Reports',
    description: 'Finding kill reports from the msssage history of this channel. This will take more time the more history there is.'
  }
  await interaction.reply({ embeds: [embed], components: [], content: null })

  const channel = interaction.channel

  try {
    logger.info(`Finding past kill reports from channel ${channel.name}`)

    let messageId = null
    let messages = await channel.messages.fetch({ limit: 100 })
    let pageCount = 0
    while (messages.size > 0) {
      pageCount++
      for (const message of messages.values()) {
        messageId = message.id

        if (message.attachments.size === 0) continue

        const images = []
        for (const attachment of message.attachments.values()) {
          if (!IMAGE_CONTENT_TYPE.test(attachment.contentType)) continue
          images.push(attachment.url)
        }
        if (images.length === 0) continue

        const myReactions = message.reactions.cache.filter(reaction => reaction.me)
        if (myReactions.size > 0) continue

        const guildId = message.guildId
        const channelId = message.channelId
        const createdBy = message.author.tag
        await BackfillMessage.findOrCreate({
          where: {
            guildId,
            channelId,
            messageId
          },
          defaults: {
            imageUrls: images.join('\n'),
            imageCount: images.length,
            status: 'PENDING',
            createdBy
          }
        })
      }
      messages = await channel.messages.fetch({ before: messageId, limit: 100 })
    }
    logger.info(`Done checking ${pageCount} pages for backfilling ${channel.name}`)

    const pastKillReports = _.first(await BackfillMessage.findAll({
      where: { guildId, channelId: channel.id, status: 'PENDING' },
      group: ['guildId'],
      attributes: [
        [sequelize.fn('count', sequelize.col('*')), 'messages'],
        [sequelize.fn('sum', sequelize.col('imageCount')), 'ccc']
      ],
      raw: true
    }))

    if (pastKillReports) {
      const embed = {
        color: colors.green,
        title: 'Found Past Kill Reports',
        description: 'You will have to contact a KMEEBO developer on Discord to get these processed due to additional costs.',
        fields: [
          { name: 'Past Kill Reports', value: formatNumber(pastKillReports.ccc) }
        ]
      }
      await interaction.channel.send({ embeds: [embed], components: [], content: null })
    } else {
      const embed = {
        color: colors.yellow,
        title: 'No Past Kill Reports Found',
        description: 'KMEEBO did not find any past kill reports it has not already processed in this channel.'
      }
      await interaction.channel.send({ embeds: [embed], components: [], content: null })
    }
  } catch (e) {
    logger.error(e.message)
  }
}

module.exports = adminFindPastKillReports
