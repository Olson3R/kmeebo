const _ = require('lodash')

const logger = require('./src/services/logger')
const { Channel, KillReport } = require('./src/models')

const KILL_REPORT_ID = process.argv[2]
if (!KILL_REPORT_ID) {
  console.error('Missing kill report id argument')
  process.exit(1)
}
const run = async () => {
  try {
    const killReport = await KillReport.findOne({
      where: { id: KILL_REPORT_ID },
      include: 'sourceImage'
    })

    const sourceImage = killReport.sourceImage
    const channelForwards = await Channel.findAll({ where: { guildId: killReport.guildId }})
    await Promise.all(_.map(channelForwards, async (channelForward) => {
      if (!channelForward.forwardToChannelId) return

      const forwardToChannel = client.channels.cache.get(channelForward.forwardToChannelId)
      if (!forwardToChannel) return

      logger.info(`Forwarding ${KILL_REPORT_ID}`)

      return await forwardToChannel.send({ content: `**From:** ${client.guilds.cache.get(killReport.guildId).name}`, files: [sourceImage.url] })
    }))

    logger.info('Done reprocessing')
  } catch (e) {
    logger.error('Failed to reprocess kill report', { errors: e.errors, error: e.message, stackTrace: e.stack })
  }
}

run()
