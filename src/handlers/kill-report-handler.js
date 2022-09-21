const axios = require('axios')
const fs = require('fs')
const fsp = require('fs/promises')
const _ = require('lodash')

const colors = require('../color-util')
const parseKillReport = require('../services/kill-report-parser')

const CHANNEL_IDS = [
  '787766810044399616', // SS#bot-dev
  '1020372930384908288' // HTP#new-km-bot-testing
]
const IMAGE_CONTENT_TYPE = /^image\//

const getImageAttachment = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer'})
  return Buffer.from(response.data, 'binary')
}

const getColor = km => {
  if (km.status === 'ERROR') return colors.red
  if (km.duplicate) return colors.yellow
  return colors.green
}

const getDescription = km => {
  if (km.status === 'ERROR') return `${km.id}\n${km.statusMessage ?? 'Unkown error'}`
  return `${km.id}\n${km.killReportId} | ${km.isk.toLocaleString()} ISK | [${km.finalBlowCorp ?? '???'}] ${km.finalBlowName}`
}

const killReportHandler = async message => {
  if (!CHANNEL_IDS.includes(message.channel.id)) return

  console.log(`${message.author.tag} in #${message.channel.name} created a message. ${message.attachments.size}`)
  if (message.attachments.size > 0) {
    const killReports = []
    for (const attachment of message.attachments.values()) {
      if (!IMAGE_CONTENT_TYPE.test(attachment.contentType)) continue

      const guildId = message.guildId
      const submittedBy = message.author.tag
      console.log(`\timage attachment: ${attachment.contentType} - ${attachment.url}`)
      const imageData = await getImageAttachment(attachment.url)

      try {
        const killReport = await parseKillReport(guildId, submittedBy, attachment.name, imageData, { url: attachment.url })
        // console.log('RESULTS', killReport)
        killReports.push(killReport)
      }
      catch(e) {
        console.error(e)
        message.react('❌')
      }
    }

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
    console.log('STATUSES', status)
    if (status === 'DUPLICATE') {
      await message.react('©️')
    }
    if (status === 'ERROR') {
      await message.react('❌')
    }
    else {
      await message.react('✅')
    }

    const embeds = _.map(killReports, km => ({
      color: getColor(km),
      description: getDescription(km)
    }))
    // const embeds = [{ description: 'this is a test' }]
    console.log('EEEE', embeds)
    await message.reply({ embeds })
  }
}

module.exports = { killReportHandler }
