const _ = require('lodash')

const colors = require('../color-util')
const { isAdmin } = require('../util')
const { BackfillMessage } = require('../models')
const logger = require('../services/logger')

const IMAGE_CONTENT_TYPE = /^image\//

const adminBackfillKillReports = async (interaction, client) => {
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

  const embed = {
    color: colors.green,
    title: 'Backfilling Kill Reports',
    description: 'Finding kill reports from the msssage history of this channel. This will take some time.'
  }
  await interaction.reply({ embeds: [embed], components: [], content: null })

  const channel = interaction.channel

  try {
    logger.info(`Backfilling from channel ${channel.name}`)

    let messageId = null
    let messages = await channel.messages.fetch({ limit: 100 })
    while (messages.size > 0) {
      // console.log(`Received ${messages.size} messages`)
      for (const message of messages.values()) {
        messageId = message.id

        if (message.attachments.size === 0) continue

        const images = []
        for (const attachment of message.attachments.values()) {
          // console.log('IMGGGG', attachment.contentType)
          if (!IMAGE_CONTENT_TYPE.test(attachment.contentType)) continue
          images.push(attachment.url)
        }
        if (images.length === 0) continue

        const myReactions = message.reactions.cache.filter(reaction => reaction.me)
        if (myReactions.size > 0) continue

        // console.log(`Processing message ${message.id}`)
        const guildId = message.guildId
        const createdBy = message.author.tag
        const backfillMessage = await BackfillMessage.create({
          guildId,
          messageId,
          imageUrls: images.join('\n'),
          imageCount: images.length,
          status: 'PENDING',
          createdBy
        })
      }
      messages = await channel.messages.fetch({ before: messageId, limit: 100 })
    }
  } catch (e) {
    logger.error(e.message)

    // const embed = {
    //   color: colors.red,
    //   title: 'Error Configuring Corp Forwarding',
    //   description: e.message
    // }
    // await interaction.reply({ embeds: [embed], components: [], content: null })
  }
}

module.exports = adminBackfillKillReports
