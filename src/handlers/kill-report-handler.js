const axios = require('axios')
const _ = require('lodash')

const colors = require('../color-util')
const parseKillReport = require('../services/kill-report-parser')
const { Channel } = require('../models')

const IMAGE_CONTENT_TYPE = /^image\//

const getImageAttachment = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' })
  return Buffer.from(response.data, 'binary')
}

const getColor = km => {
  if (km.status === 'ERROR') return colors.red
  if (km.duplicate) return colors.yellow
  return colors.green
}

const getDescription = km => {
  if (km.status === 'ERROR') return `${km.id}\n${km.statusMessage ?? 'Unkown error'}`
  const fields = [
    km.killReportId,
    `${km.isk?.toLocaleString()} ISK`,
    `[${km.finalBlowCorp ?? '???'}] ${km.finalBlowName}`
  ]
  if (km.killTag) fields.push(km.killTag)
  return `${km.id}\n${fields.join(' | ')}`
}

const killReportHandler = async (message, client) => {
  const guildId = message.guildId
  const channelId = message.channelId
  const channel = await Channel.findOne({ where: { guildId, channelId } })
  if (!channel) return

  console.log(`${message.author.tag} in #${message.channel.name} created a message. ${message.attachments.size}`)
  if (message.attachments.size > 0) {
    const killReports = []
    for (const attachment of message.attachments.values()) {
      if (!IMAGE_CONTENT_TYPE.test(attachment.contentType)) continue
      console.log('Processing attachment', attachment)

      const guildId = message.guildId
      const submittedBy = message.author.tag
      console.log(`\timage attachment: ${attachment.contentType} - ${attachment.url}`)
      const imageData = await getImageAttachment(attachment.url)

      try {
        const killReport = await parseKillReport(
          guildId,
          submittedBy,
          attachment.name,
          imageData,
          { url: attachment.url, killTag: channel.killTag }
        )
        killReports.push(killReport)
      } catch (e) {
        console.error(e)
        message.react('❌')
      }
    }

    if (killReports.length === 0) return

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
      await message.react('©️')
    } else if (status === 'ERROR') {
      await message.react('❌')
    } else {
      await message.react('✅')
    }

    const embeds = _.map(killReports, km => ({
      color: getColor(km),
      description: getDescription(km)
    }))
    await message.reply({ embeds })

    if (!channel.forwardToChannelId) return

    const successfulKillReports = killReports.filter(killReport => killReport.status === 'SUCCESS' && !killReport.duplicate)
    if (successfulKillReports.length === 0) return

    const forwardToChannel = client.channels.cache.get(channel.forwardToChannelId)
    if (!forwardToChannel) return

    await forwardToChannel.send({ content: `**From:** ${message.guild.name}`, files: _.map(successfulKillReports, 'sourceImage') })
  }
}

module.exports = { killReportHandler }
