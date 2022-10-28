const axios = require('axios')
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const _ = require('lodash')

const logger = require('./src/services/logger')
const { KillReport } = require('./src/models')
const parseKillReport = require('./src/services/kill-report-parser')

const KM_DIR = './kill-reports'
const SUBMITTED_BY = 'spidermo#1871'

const run = async () => {
  const KILL_REPORT_IDS = (await fsp.readFile('/dev/stdin', 'utf-8')).trim().split('\n');
  if (!KILL_REPORT_IDS) {
    console.error('Missing kill report ids')
    process.exit(1)
  }
  console.log(`Processing ${KILL_REPORT_IDS.length.toLocaleString()} IDs`)
  for (const killReportId of KILL_REPORT_IDS) {
    try {
      logger.info(`Processing ${killReportId}`)
      const killReport = await KillReport.findOne({
        where: { id: killReportId },
        include: 'sourceImage'
      })
      let imageFile = _.find(fs.readdirSync(KM_DIR), file => {
        const ext = path.extname(file)
        return ext && !['.csv', '.json'].includes(ext)
      })

      let imageData = null
      try {
        await fsp.access(imageFile, fsp.constants.F_OK)
        imageData = await fsp.readFile(imageFile)
      } catch(e) {
        logger.info(`Downloading missing file: ${imageFile}`)
        const sourceImage = killReport.sourceImage
        const ext = path.extname(sourceImage.url)
        const response = await axios.get(sourceImage.url, { responseType: 'arraybuffer' })
        imageFile = `${sourceImage.id}${ext}`
        imageData = Buffer.from(response.data, 'binary')
      }

      const reprocessed = await parseKillReport(killReport.guildId, SUBMITTED_BY, imageFile, imageData, { reprocess: true })
    } catch (e) {
      logger.error('Failed to reprocess kill report', { errors: e.errors, error: e.message, stackTrace: e.stack })
    }
  }

  logger.info('Done reprocessing')
}

run()
