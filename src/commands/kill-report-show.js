const { DateTime } = require('luxon')
const _ = require('lodash')

const colors = require('../color-util')
const { KillReport } = require('../models')

const formatDate = (text) => {
  if (!text) return '???'

  return text.toLocaleString(DateTime.DATETIME_SHORT)
}

const formatNumber = (text) => {
  if (_.isNil(text)) return '???'

  return text.toLocaleString()
}

const killReportShow = async (interaction) => {
  const guildId = interaction.guildId
  const id = interaction.options.getString('id')

  const killReport = await KillReport.findOne({ where: { id, guildId } })

  if (killReport) {
    const fields = [
      { name: 'Kill Report Id', value: killReport.killReportId },
      { name: 'Ship', value: `[${killReport.shipType || '???'}] ${killReport.shipName || '???'}` },
      { name: 'Isk', value: formatNumber(killReport.isk) },
      { name: 'Total Damage', value: formatNumber(killReport.totalDamage) },
      { name: 'Warp Scramble Strength', value: formatNumber(killReport.warpScrambleStrength) },
      { name: 'Participant Count', value: formatNumber(killReport.participantCount) },
      { name: 'Location', value: `${killReport.system} < ${killReport.constellation} < ${killReport.region}` },
      { name: 'Killed At', value: formatDate(killReport.killedAt) },
      { name: 'Victim', value: `[${killReport.victimCorp || '???'}] ${killReport.victimName || '???'}` },
      { name: 'Final Blow', value: `[${killReport.finalBlowCorp || '???'}] ${killReport.finalBlowName || '???'}` },
      { name: 'Top Damage', value: `[${killReport.topDamageCorp || '???'}] ${killReport.topDamageName || '???'}` }
    ]
    if (killReport.killTag) {
      fields.push({ name: 'Kill Tag', value: killReport.killTag })
    }

    const embed = {
      color: colors.green,
      title: `Parsed kill mail ${killReport.killReportId}`,
      image: { url: killReport.sourceImage },
      footer: { text: killReport.id },
      fields
    }
    await interaction.reply({ embeds: [embed] })
  } else {
    const embed = {
      color: colors.red,
      title: `Could not find kill report for id ${id}`
    }
    await interaction.reply({ embeds: [embed], ephemeral: true })
  }
}

module.exports = killReportShow
