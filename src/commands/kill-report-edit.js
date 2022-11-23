const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const fsp = require('fs/promises')
const { v4: uuidv4 } = require('uuid')
const _ = require('lodash')

const colors = require('../color-util')
const { isEditor } = require('../util')
const { KillReport } = require('../models')

const formatDate = (text) => {
  if (!text) return '???'

  return text.toLocaleString(DateTime.DATETIME_SHORT)
}

const formatNumber = (text) => {
  if (_.isNil(text)) return '???'

  return text.toLocaleString()
}

const killReportEdit = async (interaction) => {
  const guildId = interaction.guildId

  if (!(await isEditor(guildId, interaction.member))) {
    const embed = {
      color: colors.red,
      title: 'Insufficient Privileges',
      description: 'Admin or Editor permission is required for this command.'
    }
    await interaction.reply({ embeds: [embed] })
    return
  }

  const id = interaction.options.getString('id')
  const killReportId = interaction.options.getString('kill-report-id')

  const where = { guildId }
  if (id) {
    where.id = id
  }
  else if(killReportId) {
    where.killReportId = killReportId
  }
  else {
    const embed = {
      color: colors.red,
      title: 'Needs Id or Kill Report Id',
      description: 'Need to supply an id or kill report id to edit.'
    }
    await interaction.reply({ embeds: [embed] })
    return
  }

  const killReport = await KillReport.findOne({
    where,
    include: 'sourceImage'
  })

  if (killReport) {
    const isk = interaction.options.getNumber('isk')
    const warpScrambleStrength = interaction.options.getNumber('warp-scramble-strength')
    const totalDamage = interaction.options.getNumber('total-damage')
    const participantCount = interaction.options.getNumber('participant-count')
    const victimCorp = interaction.options.getString('victim-corp')
    const victimName = interaction.options.getString('victim-name')
    const finalBlowCorp = interaction.options.getString('final-blow-corp')
    const finalBlowName = interaction.options.getString('final-blow-name')
    const topDamageCorp = interaction.options.getString('top-damage-corp')
    const topDamageName = interaction.options.getString('top-damage-name')
    const shipType = interaction.options.getString('ship-type')
    const shipName = interaction.options.getString('ship-name')
    const killedAt = interaction.options.getString('killedAt')

    const data = {
      isk,
      warpScrambleStrength,
      totalDamage,
      participantCount,
      victimCorp,
      victimName,
      finalBlowCorp,
      finalBlowName,
      topDamageCorp,
      topDamageName,
      shipType,
      shipName
    }
    if (killedAt) {
      data.killedAt = DateTime.fromFormat(killedAt, 'yyyy/MM/dd HH:mm:ss ZZZ')

      if (!Date.killedAt.isValid) {
        const embed = {
          color: colors.red,
          title: 'Incorrect date format',
          description: 'The date format needs to follow yyyy/MM/dd HH:mm:ss ZZZ (e.g. 2022/01/30 13:45:12 -0100).'
        }
        await interaction.reply({ embeds: [embed] })
        return
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (_.isNil(value)) continue

      killReport[key] = value
    }
    killReport.save()

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
    const embed = {
      color: colors.green,
      title: `Kill Report ${killReport.killReportId}`,
      image: { url: killReport.sourceImage?.url },
      footer: { text: killReport.id },
      fields
    }
    await interaction.reply({ embeds: [embed] })
  } else {
    const embed = {
      color: colors.red,
      title: 'Could not find kill report'
    }
    await interaction.reply({ embeds: [embed], ephemeral: true })
  }
}

module.exports = killReportEdit
