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

const killReportStats = async (interaction) => {
  const guildId = interaction.guildId
  const period = interaction.options.getString('period') ?? 'current-month'
  const strStartDt = interaction.options.getString('start-date')
  const strEndDt = interaction.options.getString('end-date')
  const corporations = interaction.options.getString('victim-corporations')
  const killTag = interaction.options.getString('kill-tag')

  const startDt = DateTime.fromISO(strStartDt)
  const endDt = DateTime.fromISO(strEndDt)

  let periodName = 'Lifetime'
  const where = { guildId, type: 'kill', status: 'SUCCESS' }
  if (killTag) {
    where.killTag = killTag
  }
  if (corporations) {
    where.victimCorp = { [Op.in]: _.map(corporations.split(','), _.trim) }
  }
  if (startDt.isValid || endDt.isValid) {
    if (startDt.isValid && endDt.isValid) {
      where[Op.and] = [
        { killedAt: { [Op.gt]: startDt.toJSDate() }},
        { killedAt: { [Op.lt]: endDt.toJSDate() }},
      ]
    }
    else if (startDt.isValid) {
      where[Op.and] = [
        { killedAt: { [Op.gt]: startDt.toJSDate() }},
        { killedAt: { [Op.lt]: DateTime.utc().toJSDate() }},
      ]
    }
    else if (endDt.isValid) {
      where.killedAt = { [Op.lt]: endDt.toJSDate() }
    }
    periodName = 'Custom'
  }
  else if (period === 'current-month') {
    where[Op.and] = [
      { killedAt: { [Op.gt]: DateTime.now().startOf('month').toJSDate() }},
      { killedAt: { [Op.lt]: DateTime.now().startOf('month').plus({ month: 1 }).toJSDate() }},
    ]
    periodName = 'Current Month\'s'
  }
  else if (period === 'last-month') {
    where[Op.and] = [
      { killedAt: { [Op.gt]: DateTime.now().startOf('month').minus({ month: 1 }).toJSDate() }},
      { killedAt: { [Op.lt]: DateTime.now().startOf('month').toJSDate() }},
    ]
    periodName = 'Last Month\'s'
  }
  const stats = await KillReport.findAll({
    where,
    group: ['shipType'],
    attributes: [
      'shipType',
      [sequelize.fn('count', sequelize.col('*')), 'kills'],
      [sequelize.fn('sum', sequelize.col('isk')), 'isk']
    ],
    order: [['isk', 'desc']],
    raw: true
  })

  const totalIsk = _.chain(stats).map('isk').map(v => parseInt(v, 10)).sum().value()
  const grandTotals = `**Grand Total** ${formatNumber(totalIsk)} Isk (Kills: ${formatNumber(_.sumBy(stats, 'kills'))})`
  const results = _.map(stats, (row, index) => `**${row.shipType ?? 'Unknown'}** ${formatNumber(row.isk)} Isk (Kills: ${formatNumber(row.kills)})`)
  const embed = {
    type: 'rich',
    color: colors.green,
    title: `Kill Report Stats${killTag ? ` For Kill Tag ${killTag}` : ''}`,
    description: `**Period:** ${periodName}\n` +
      (startDt.isValid ? `**Start Date:** ${startDt.toLocaleString(DateTime.DATETIME_SHORT)}\n` : '') +
      (endDt.isValid ? `**End Date:** ${endDt.toLocaleString(DateTime.DATETIME_SHORT)}\n` : '') +
      (corporations?.length ? `**Victim Corporations:** ${_.map(corporations.split(','), _.trim).join(', ')}\n` : '') +
      `\n${grandTotals}\n\n${results.join('\n')}`
  }

  await interaction.reply({ embeds: [embed] })
}

module.exports = killReportStats
