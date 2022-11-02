const { QueryTypes } = require('sequelize')
const _ = require('lodash')

const { formatNumber } = require('../util')
const colors = require('../color-util')
const { Pilot, sequelize } = require('../models')

const userStats = async (interaction) => {
  const guildId = interaction.guildId
  // const period = interaction.options.getString('period') ?? 'monthly'
  const user = interaction.options.getUser('user') ?? interaction.user
  const discordTag = user.tag
  const scoring = interaction.options.getString('scoring') ?? 'final-blow'
  // const killTag = interaction.options.getString('kill-tag')
  const SCORING = {
    'final-blow': { text: 'Final Blow', joinCondition: 'KillReports.finalBlowName = Pilots.name' },
    'top-damage': { text: 'Top Damage', joinCondition: 'KillReports.topDamageName = Pilots.name' },
    'final-blow-or-top-damage': { text: 'Final Blow or Top Damage', joinCondition: 'KillReports.finalBlowName = Pilots.name OR KillReports.topDamageName = Pilots.name' }
  }


  let periodName = 'Lifetime'
  let periodGroup = ''
  let scoringData = SCORING[scoring]
  const replacements = { guildId, discordTag }
  // if (killTag) {
  //   replacements.killTag = killTag
  // }
  // if (period === 'monthly') {
  //   replacements.startDt = DateTime.now().startOf('month').minus({ month: 1 }).toJSDate()
  //   // replacements.endDt = DateTime.now().startOf('month').plus({ month: 1 }).toJSDate()
  //   periodName = 'Month'
  // }
  // else if (period === 'weekly') {
  //   replacements.startDt = DateTime.now().startOf('week').minus({ week: 1 }).toJSDate()
  //   // replacements.endDt = DateTime.now().startOf('month').toJSDate()
  //   periodName = 'Week'
  // }
  const killStats = _.first(await sequelize.query(
    'SELECT COUNT(*) as `kills`, SUM(KillReports.isk) as `isk`, MAX(KillReports.isk) as `maxIsk`' +
    ` FROM Pilots INNER JOIN KillReports ON ${scoringData.joinCondition}` +
    ' WHERE Pilots.guildId = :guildId AND KillReports.guildId = :guildId AND KillReports.status = \'SUCCESS\'' +
    ' AND Pilots.discordTag = :discordTag' +
    (replacements.startDt ? ' AND KillReports.killedAt >= :startDt' : ''),
    {
      type: QueryTypes.SELECT,
      replacements
    }
  ))
  const lossStats = _.first(await sequelize.query(
    'SELECT COUNT(*) as `kills`, SUM(KillReports.isk) as `isk`, MAX(KillReports.isk) as `maxIsk`' +
    ` FROM Pilots INNER JOIN KillReports ON KillReports.victimName = Pilots.name` +
    ' WHERE Pilots.guildId = :guildId AND KillReports.guildId = :guildId AND KillReports.status = \'SUCCESS\'' +
    ' AND Pilots.discordTag = :discordTag' +
    (replacements.startDt ? ' AND KillReports.killedAt >= :startDt' : ''),
    {
      type: QueryTypes.SELECT,
      replacements
    }
  ))
  const pilots = await Pilot.findAll({ where: { discordTag }})

  const embed = {
    type: 'rich',
    color: colors.green,
    title: `${periodName} User Stats`,
    description: `User: ${user}\nPilots: ${_.map(pilots, 'name').join(', ')}\nScored based on ${scoringData.text}\n\n` +
      `**Kills** ${formatNumber(killStats.kills)}\n` +
      `**Isk Killed** ${formatNumber(killStats.isk)}\n` +
      `**Avg Isk/Kill** ${formatNumber(killStats.isk / killStats.kills)}\n` +
      `**Largest Kill** ${formatNumber(killStats.maxIsk)}\n\n` +
      `**Losses** ${formatNumber(lossStats.kills)}\n` +
      `**Isk Lost** ${formatNumber(lossStats.isk)}\n` +
      `**Avg Isk/Loss** ${formatNumber(lossStats.isk / lossStats.kills)}`
  }

  await interaction.reply({ embeds: [embed] })
}

module.exports = userStats
