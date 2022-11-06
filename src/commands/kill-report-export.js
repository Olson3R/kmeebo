const fsp = require('fs/promises')
const _ = require('lodash')

const colors = require('../color-util')
const { KillReport } = require('../models')

const killReportExport = async (interaction) => {
  await interaction.deferReply()

  const guildId = interaction.guildId
  const killTag = interaction.options.getString('kill-tag')

  const where = { guildId, status: 'SUCCESS' }
  if (killTag) where.killTag = killTag

  const killReportIds = await KillReport.findAll({
    attributes: ['id'],
    where,
    order: [['killedAt', 'ASC']]
  })

  if (killReportIds.length > 0) {
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

    const files = []
    for (const chunk of _.chunk(_.map(killReportIds, 'id'), 50000)) {
      const killReports = await KillReport.findAll({
        where: { id: chunk},
        order: [['killedAt', 'ASC']],
        include: 'sourceImage',
      })
      const reports = _.map(killReports, km => _.map(headers, h => _.get(km, h)).join(','))
      files.push({ attachment: Buffer.from(`${headers.join(',')}\n${reports.join('\n')}`, 'utf-8'), name: `kill-report-export-${files.length+1}.csv` })
    }
    console.log(files[0])

    const embed = {
      color: colors.green,
      title: `Exported ${killReportIds.length} kill reports`
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
