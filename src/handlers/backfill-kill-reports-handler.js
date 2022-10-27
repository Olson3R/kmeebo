const axios = require('axios')
const _ = require('lodash')

const parseKillReport = require('../services/kill-report-parser')
const { BackfillMessage, Channel } = require('../models')
const logger = require('../services/logger')

const IMAGE_CONTENT_TYPE = /^image\//

const getImageAttachment = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' })
  return Buffer.from(response.data, 'binary')
}

const getBackfillMessage = () => {
  return BackfillMessage.findOne({
    where: {
      status: 'QUEUED'
    },
    order: [['updatedAt', 'ASC']],
    limit: 1
  })
}

const processBackfillMessage = async (client, backfillMessage) => {
  const guildId = backfillMessage.guildId
  const channelId = backfillMessage.channelId
  const discordChannel = client.channels.cache.get(channelId)
  const discordMessage = await discordChannel.messages.fetch(backfillMessage.messageId)
  if (!discordMessage) return false

  const submittedBy = discordMessage.author?.tag
  const channel = await Channel.findOne({ where: { guildId, channelId } })
  if (!channel) return false

  const killReports = []
  for (const imageUrl of backfillMessage.imageUrls.split('\n')) {
    const imageData = await getImageAttachment(imageUrl)

    try {
      const killReport = await parseKillReport(
        guildId,
        submittedBy,
        imageUrl,
        imageData,
        { url: imageUrl, killTag: channel.killTag }
      )
      killReports.push(killReport)
    } catch (e) {
      console.error(e)
      discordMessage.react('❌')
    }
  }

  if (killReports.length === 0) return true

  const status = _.chain(killReports)
    .map(km => km.duplicate ? 'DUPLICATE' : km.status)
    .reduce(
      (result, km) => {
        if (result === 'ERROR' || km === 'ERROR') return 'ERROR'
        if (result === 'DUPLICATE' || km === 'DUPLICATE') return 'DUPLICATE'
        return 'SUCCESS'
      },
      'SUCCESS'
    )
    .value()
  if (status === 'DUPLICATE') {
    await discordMessage.react('©️')
  } else if (status === 'ERROR') {
    await discordMessage.react('❌')
  } else {
    await discordMessage.react('✅')
  }

  return true
}

const backfillKillReportsHandler = async (client) => {
  try {
    let backfillMessage = await getBackfillMessage()
    while(backfillMessage) {
      const success = await processBackfillMessage(client, backfillMessage)
      backfillMessage.status = success ? 'SUCCESS' : 'FAILURE'
      await backfillMessage.save()
      logger.info(`Processed backfill message ${backfillMessage.id}`)

      backfillMessage = await getBackfillMessage()
    }
  } catch(e) {
    logger.error(e.stack)
  }

  logger.info('Waiting for more backfill messages')
  setTimeout(() => { backfillKillReportsHandler(client) }, 2 * 60 * 1000)
}

module.exports = { backfillKillReportsHandler }
