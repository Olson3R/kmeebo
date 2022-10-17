const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const _ = require('lodash')

const logger = require('./src/services/logger')
const { KillReport } = require('./src/models')
const parseKillReport = require('./src/services/kill-report-parser')

const KM_DIR = './kill-reports'
const KILL_REPORT_ID = process.argv[2]
if (!KILL_REPORT_ID) {
  console.error('Missing kill report id argument')
  process.exit(1)
}
const SUBMITTED_BY = 'spidermo#1871'

const run = async () => {
  try {
    const killReport = await KillReport.findOne({
      where: { id: KILL_REPORT_ID },
      include: 'sourceImage'
    })
    let imageFile = _.find(fs.readdirSync(KM_DIR), file => {
      const ext = path.extname(file)
      return ext && !['.csv', '.json'].includes(ext)
    })

    try {
      await fsp.access(imageFile, fsp.constants.F_OK)
    } catch(e) {
      logger.info(`File missing: ${imageFile}`)
      return
    }

    logger.info(`Processing file ${file}`)
    const imageData = fs.readFileSync(imageFile)
    await parseKillReport(killReport.guildId, SUBMITTED_BY, imageFile, imageData, { reprocess: true })

    logger.info('Done reprocessing')
  } catch (e) {
    logger.error('Failed to reprocess kill report', { errors: e.errors, error: e.message, stackTrace: e.stack })
  }
}

run()
