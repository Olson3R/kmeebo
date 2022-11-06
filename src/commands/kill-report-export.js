const _ = require('lodash')

const colors = require('../color-util')
const { KillReport } = require('../models')

const killReportExport = async (interaction) => {
  interaction.deferReply()

  const guildId = interaction.guildId
  const killTag = interaction.options.getString('kill-tag')

  const where = { guildId, status: 'SUCCESS' }
  if (killTag) where.killTag = killTag

  const killReports = await KillReport.findAll({
    where,
    order: [['killedAt', 'ASC']],
    include: 'sourceImage'
  })

  if (killReports.length > 0) {
    const headers = [
      'id',
      'lang',
      'killReportId',
      'type',
      'killTag',
      'shipType',
      'shipName',
      'isk',
      'totalDamage',
      'warpScrambleStrength',
      'participantCount',
      'region',
      'constellation',
      'system',
      'killedAt',
      'victimCorp',
      'victimName',
      'finalBlowCorp',
      'finalBlowName',
      'topDamageCorp',
      'topDamageName',
      'sourceImage.url'
    ]
    const reports = _.map(killReports, km => _.map(headers, h => _.get(km, h)).join(','))
    const files = _.chain(reports)
      .chunk(50000)
      .map((chunk, index) => ({ attachment: Buffer.from(`${headers.join(',')}\n${chunk.join('\n')}`, 'utf-8'), name: `kill-report-export-${index+1}.csv` }))
      .value

    const embed = {
      color: colors.green,
      title: `Exported ${killReports.length} kill reports`
    }
    await interaction.editReply({ embeds: [embed], files })
  } else {
    const embed = {
      color: colors.red,
      title: 'Could not find any kill reports'
    }
    await interaction.editReply({ embeds: [embed], ephemeral: true })
  }
}

module.exports = killReportExport
