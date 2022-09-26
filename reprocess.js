const fs = require('fs')
const path = require('path')
const _ = require('lodash')


const logger = require('./src/services/logger')
const parseKillReport = require('./src/services/kill-report-parser')

const KM_DIR = './kill-reports'
const GUILD_ID = process.argv[2]
if (!GUILD_ID) {
  console.error('Missing guild id argument')
  process.exit(1)
}
const SUBMITTED_BY = 'spidermo#1871'

const run = async () => {
  try {
    const files = _.filter(fs.readdirSync(KM_DIR), file => {
      const ext = path.extname(file)
      return ext && !['.csv', '.json'].includes(ext)
    })
    for (const file of files) {
      logger.info(`Processing file ${file}`)
      const imageFile = `${KM_DIR}/${file}`
      const imageData = fs.readFileSync(imageFile)
      await parseKillReport(GUILD_ID, SUBMITTED_BY, imageFile, imageData, { reprocess: true })
    }
    logger.info('Done reprocessing')
  }
  catch(e) {
    logger.error('Failed to reprocess kill reports', { errors: e.errors, error: e.message, stackTrace: e.stack })
  }
}
run()
