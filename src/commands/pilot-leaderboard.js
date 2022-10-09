const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const _ = require('lodash')

const colors = require('../color-util')
const { KillReport, sequelize } = require('../models')

const formatNumber = (text) => {
  if (_.isNil(text)) return '???'
  if (_.isNaN(text)) text = 0

  return Math.round(text).toLocaleString()
}

const pilotLeaderboard = async (interaction) => {
  const guildId = interaction.guildId
  const days = interaction.options.getInteger('days')
  const killTag = interaction.options.getString('kill-tag')

  const where = { guildId, finalBlowName: { [Op.ne]: null }, status: 'SUCCESS' }
  if (killTag) {
    where.killTag = killTag
  }
  if (days > 0) {
    where.killedAt = { [Op.gt]: DateTime.now().minus({ days }).toJSDate() }
  }
  const leaderboard = await KillReport.findAll({
    where,
    group: ['finalBlowName'],
    attributes: [
      ['finalBlowName', 'name'],
      [sequelize.fn('count', sequelize.col('*')), 'kills'],
      [sequelize.fn('sum', sequelize.col('isk')), 'isk']
    ],
    order: [['isk', 'desc']],
    limit: 20,
    raw: true
  })

  const embed = {
    type: 'rich',
    color: colors.green,
    title: `${days ? `${days} Day` : 'Lifetime'} Pilot Leaderboard${killTag ? ` For Kill Tag ${killTag}` : ''}`,
    description: _.map(leaderboard, (row, index) => `**${index + 1}. ${row.name}** ${formatNumber(row.isk)} Isk (Kills: ${formatNumber(row.kills)})`).join('\n')
  }

  await interaction.reply({ embeds: [embed] })
}

module.exports = pilotLeaderboard
