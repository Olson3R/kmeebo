const { Attachment } = require('discord.js')
const _ = require('lodash')

const colors = require('../color-util')
const { KillReport } = require('../models')

const killReportExport = async (interaction) => {
  // interaction.deferReply()

  const guildId = interaction.guildId

  const killReports = await KillReport.findAll({
    where: { guildId, status: 'SUCCESS' },
    order: [['killedAt', 'ASC']]
  })

  if (killReports.length > 0) {
    const headers = [
      'id',
      'killReportId',
      'lang',
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
      'topDamageName'
    ]
    const reports = _.map(killReports, km => _.map(headers, h => km[h]).join(','))
    const csv = Buffer.from(`${headers.join(',')}\n${reports.join('\n')}`, 'utf-8')

    const embed = {
      color: colors.green,
      title: `Exported ${killReports.length} kill reports`,
    }
    await interaction.reply({ embeds: [embed], files: [{ attachment: csv, name: 'kill-report-export.csv'}] })
    // await interaction.reply({ embeds: [embed], attachments: [new AttachmentBuilder(csv, { name: 'kmeebo-export.csv'})] })
  }
  else {
    const embed = {
      color: colors.red,
      title: `Could not find any kill reports`
    }
    await interaction.reply({ embeds: [embed], ephemeral: true })
  }
}

module.exports = killReportExport
