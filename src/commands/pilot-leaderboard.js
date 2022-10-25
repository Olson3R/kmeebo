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
  const period = interaction.options.getString('period') ?? 'current-month'
  const killTag = interaction.options.getString('kill-tag')

  let periodName = 'Lifetime'
  const where = { guildId, finalBlowName: { [Op.ne]: null }, status: 'SUCCESS' }
  if (killTag) {
    where.killTag = killTag
  }
  if (period === 'current-month') {
    where.killedAt = { [Op.gt]: DateTime.now().startOf('month').toJSDate() }
    periodName = 'Current Month\'s'
  }
  else if (period === 'last-month') {
    where[Op.and] = [
      { killedAt: { [Op.gt]: DateTime.now().startOf('month').minus({ month: 1 }).toJSDate() }},
      { killedAt: { [Op.lt]: DateTime.now().startOf('month').toJSDate() }},
    ]
    periodName = 'Last Month\'s'
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
    title: `${periodName} Pilot Leaderboard${killTag ? ` For Kill Tag ${killTag}` : ''}`,
    description: _.map(leaderboard, (row, index) => `**${index + 1}. ${row.name}** ${formatNumber(row.isk)} Isk (Kills: ${formatNumber(row.kills)})`).join('\n')
  }

  await interaction.reply({ embeds: [embed] })
}

module.exports = pilotLeaderboard
