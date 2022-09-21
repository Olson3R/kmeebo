const axios = require('axios')
const fs = require('fs')
const fsp = require('fs/promises')

const parseKillReport = require('../services/kill-report-parser')

const IMAGE_CONTENT_TYPE = /^image\//

const getImageAttachment = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer'})
  return Buffer.from(response.data, 'binary')
}

const killReportHandler = async message => {
  console.log(`${message.author.tag} in #${message.channel.name} created a message. ${message.attachments.size}`)
  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      if (!IMAGE_CONTENT_TYPE.test(attachment.contentType)) continue

      const guildId = message.guildId
      const submittedBy = message.author.tag
      console.log(`\timage attachment: ${attachment.contentType} - ${attachment.url}`)
      const imageData = await getImageAttachment(attachment.url)
      // const imagePath = `${KILL_REPORT_DIR}/${guildId}`
      // if (!fs.existsSync(imagePath)) {
      //   fs.mkdirSync(imagePath, { recursive: true })
      // }
      // await fsp.writeFile(`${imagePath}/${attachment.name}`, imageData)
      try {
        const killReport = await parseKillReport(guildId, submittedBy, attachment.name, imageData, { url: attachment.url })
        console.log('RESULTS', killReport)
        if (killReport.duplicate) {
          message.react('©️')
        }
        else if(killReport.status !== 'SUCCESS') {
          message.react('❌')
        }
        else {
          message.react('✅')
        }
      }
      catch(e) {
        console.error(e)
        message.react('❌')
      }
    }
  }
}

module.exports = { killReportHandler }
