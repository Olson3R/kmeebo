const { QueryTypes } = require('sequelize')
const { DateTime } = require('luxon')
const _ = require('lodash')

const colors = require('../color-util')
const { sequelize } = require('../models')

const formatNumber = (text) => {
  if (_.isNil(text)) return '???'
  if (_.isNaN(text)) text = 0

  return Math.round(text).toLocaleString()
}

const userLeaderboard = async (interaction) => {
  const guildId = interaction.guildId
  const period = interaction.options.getString('period') ?? 'current-month'
  const killTag = interaction.options.getString('kill-tag')


  let periodName = 'Lifetime'
  const replacements = { guildId }
  if (killTag) {
    replacements.killTag = killTag
  }
  if (period === 'current-month') {
    replacements.startDt = DateTime.now().startOf('month').toJSDate()
    replacements.endDt = DateTime.now().startOf('month').plus({ month: 1 }).toJSDate()
    periodName = 'Current Month\'s'
  }
  else if (period === 'last-month') {
    replacements.startDt = DateTime.now().startOf('month').minus({ month: 1 }).toJSDate()
    replacements.endDt = DateTime.now().startOf('month').toJSDate()
    periodName = 'Last Month\'s'
  }
  const leaderboard = await sequelize.query(
    'SELECT Pilots.discordTag, COUNT(*) as `kills`, SUM(KillReports.isk) as `isk`' +
    ' FROM Pilots INNER JOIN KillReports ON KillReports.finalBlowName = Pilots.name' +
    ' WHERE Pilots.guildId = :guildId AND KillReports.guildId = :guildId AND KillReports.status = \'SUCCESS\'' +
    (replacements.startDt ? ' AND KillReports.killedAt >= :startDt' : '') +
    (replacements.endDt ? ' AND KillReports.killedAt < :endDt' : '') +
    (replacements.killTag ? ' AND KillReports.killTag = :killTag' : '') +
    ' GROUP BY Pilots.discordTag' +
    ' ORDER BY isk DESC' +
    ' LIMIT 20',
    {
      type: QueryTypes.SELECT,
      replacements
    }
  )

  const embed = {
    type: 'rich',
    color: colors.green,
    title: `${periodName} User Leaderboard${killTag ? ` For Kill Tag ${killTag}` : ''}`,
    description: _.map(leaderboard, (row, index) => `**${index + 1}. ${row.discordTag}** ${formatNumber(row.isk)} Isk (Kills: ${formatNumber(row.kills)})`).join('\n')
  }

  await interaction.reply({ embeds: [embed] })
}

module.exports = userLeaderboard
