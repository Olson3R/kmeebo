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
    const csv = Buffer.from(`${headers.join(',')}\n${reports.join('\n')}`, 'utf-8')

    const embed = {
      color: colors.green,
      title: `Exported ${killReports.length} kill reports`
    }
    await interaction.editReply({ embeds: [embed], files: [{ attachment: csv, name: 'kill-report-export.csv' }] })
    // await interaction.reply({ embeds: [embed], attachments: [new AttachmentBuilder(csv, { name: 'kmeebo-export.csv'})] })
  } else {
    const embed = {
      color: colors.red,
      title: 'Could not find any kill reports'
    }
    await interaction.editReply({ embeds: [embed], ephemeral: true })
  }
}

module.exports = killReportExport
