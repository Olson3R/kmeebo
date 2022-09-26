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

const corporationLeaderboard = async (interaction) => {
  const guildId = interaction.guildId
  const days = interaction.options.getInteger('days')

  const where = { guildId, finalBlowCorp: { [Op.ne]: null }, status: 'SUCCESS' }
  if (days > 0) {
    where['killedAt'] = { [Op.gt]: DateTime.now().minus({ days }).toJSDate() }
  }
  const leaderboard = await KillReport.findAll({
    where,
    group: ['finalBlowCorp'],
    attributes: [
      'finalBlowCorp',
      [sequelize.fn('count', sequelize.col('*')), 'kills'],
      [sequelize.fn('sum', sequelize.col('isk')), 'isk']
    ],
    order: [['isk', 'desc']],
    limit: 10,
    raw: true
  })
console.log('LLLL', leaderboard)
  const embed = {
    type: 'rich',
    color: colors.green,
    title: `${days ? `${days} Day` : 'Lifetime'} Corporation Leaderboard`,
    description: _.map(leaderboard, (row, index) => `**${index + 1}. ${row.finalBlowCorp}** ${formatNumber(row.isk)} Isk (Kills: ${formatNumber(row.kills)})`).join('\n')
  }

  await interaction.reply({ embeds: [embed] })
}

module.exports = corporationLeaderboard
