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
  const days = interaction.options.getInteger('days')
  const killTag = interaction.options.getString('kill-tag')

  // const where = { guildId, finalBlowName: { [Op.ne]: null }, status: 'SUCCESS' }
  // if (killTag) {
  //   where['killTag'] = killTag
  // }
  // if (days > 0) {
  //   where['killedAt'] = { [Op.gt]: DateTime.now().minus({ days }).toJSDate() }
  // }
  const leaderboard = await sequelize.query(
    'SELECT Pilots.discordTag, COUNT(*) as `kills`, SUM(KillReports.isk) as `isk`' +
    ' FROM Pilots INNER JOIN KillReports ON KillReports.finalBlowName = Pilots.name' +
    ' WHERE Pilots.guildId = :guildId AND KillReports.guildId = :guildId AND KillReports.status = \'SUCCESS\'' +
    (days > 0 ? ' AND KillReports.killedAt > :killedAtDate' : '') +
    (killTag ? ' AND KillReports.killTag = :killTag' : '') +
    ' GROUP BY Pilots.discordTag' +
    ' ORDER BY isk DESC' +
    ' LIMIT 20',
    {
      type: QueryTypes.SELECT,
      replacements: {
        guildId,
        killedAtDate: DateTime.now().minus({ days }).toJSDate(),
        killTag
      }
    }
  )

  const embed = {
    type: 'rich',
    color: colors.green,
    title: `${days ? `${days} Day` : 'Lifetime'} User Leaderboard${killTag ? ` For Kill Tag ${killTag}` : ''}`,
    description: _.map(leaderboard, (row, index) => `**${index + 1}. ${row.discordTag}** ${formatNumber(row.isk)} Isk (Kills: ${formatNumber(row.kills)})`).join('\n')
  }

  await interaction.reply({ embeds: [embed] })
}

module.exports = userLeaderboard
