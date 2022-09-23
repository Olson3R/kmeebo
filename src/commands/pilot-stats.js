const { DateTime } = require('luxon')
const _ = require('lodash')

const colors = require('../color-util')
const { KillReport } = require('../models')

// const formatDate = (text) => {
//   if (!text) return '???'

//   return text.toLocaleString(DateTime.DATETIME_SHORT)
// }

const formatNumber = (text) => {
  if (_.isNil(text)) return '???'
  if (_.isNaN(text)) text = 0

  return text.toLocaleString()
}

const pilotStats = async (interaction) => {
  const guildId = interaction.guildId
  const pilotName = interaction.options.getString('pilot')

  const killReports = await KillReport.findAll({ where: { guildId, finalBlowName: pilotName, status: 'SUCCESS' }})
  const lossReports = await KillReport.findAll({ where: { guildId, victimName: pilotName, status: 'SUCCESS' }})

  const now = DateTime.now()
  const iskKilled = _.sumBy(killReports, 'isk')
  const iskLost = _.sumBy(lossReports, 'isk')

  const lifetime = {
    type: 'rich',
    color: colors.red,
    title: 'Lifetime Stats',
    description: `**Kills** ${formatNumber(killReports.length)}\n` +
      `**Isk Killed** ${formatNumber(iskKilled)}\n` +
      `**Avg Isk/Kill** ${formatNumber(iskKilled / killReports.length)}\n` +
      `**Largest Kill** ${formatNumber(_.maxBy(killReports, 'isk')?.isk)}\n\n` +
      `**Losses** ${formatNumber(lossReports.length)}\n` +
      `**Isk Lost** ${formatNumber(_.sumBy(lossReports, 'isk'))}\n` +
      `**Avg Isk/Loss** ${formatNumber(iskLost / lossReports.length)}`
  }

  const weeklyKillReports = _.filter(killReports, km => km.killedAt >= now.minus({ days: 7 }))
  const weeklyLossReports = _.filter(lossReports, km => km.killedAt >= now.minus({ days: 7 }))
  const weeklyIskKilled = _.sumBy(weeklyKillReports, 'isk')
  const weeklyIskLost = _.sumBy(weeklyLossReports, 'isk')

  const weekly = {
    type: 'rich',
    color: colors.yellow,
    title: '7 Day Stats',
    description: `**Kills** ${formatNumber(weeklyKillReports.length)}\n` +
      `**Isk Killed** ${formatNumber(weeklyIskKilled)}\n` +
      `**Avg Isk/Kill** ${formatNumber(weeklyIskKilled / weeklyKillReports.length)}\n\n` +
      `**Losses** ${formatNumber(weeklyLossReports.length)}\n` +
      `**Isk Lost** ${formatNumber(_.sumBy(weeklyLossReports, 'isk'))}\n` +
      `**Avg Isk/Loss** ${formatNumber(weeklyIskLost / weeklyLossReports.length)}`
  }



  const dailyKillReports = _.filter(killReports, km => km.killedAt >= now.minus({ days: 1 }))
  const dailyLossReports = _.filter(lossReports, km => km.killedAt >= now.minus({ days: 1 }))
  const dailyIskKilled = _.sumBy(dailyKillReports, 'isk')
  const dailyIskLost = _.sumBy(dailyLossReports, 'isk')

  const daily = {
    type: 'rich',
    color: colors.green,
    title: '24 Hour Stats',
    description: `**Kills** ${formatNumber(dailyKillReports.length)}\n` +
      `**Isk Killed** ${formatNumber(dailyIskKilled)}\n` +
      `**Avg Isk/Kill** ${formatNumber(dailyIskKilled / dailyKillReports.length)}\n\n` +
      `**Losses** ${formatNumber(dailyLossReports.length)}\n` +
      `**Isk Lost** ${formatNumber(_.sumBy(dailyLossReports, 'isk'))}\n` +
      `**Avg Isk/Loss** ${formatNumber(dailyIskLost / dailyLossReports.length)}`
  }
  await interaction.reply({ content: `Pilot stats for ${pilotName}`, embeds: [lifetime, weekly, daily] })
}

module.exports = pilotStats
