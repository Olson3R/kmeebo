const { Op } = require('sequelize')
const { DateTime } = require('luxon')
const fsp = require('fs/promises')
const { v4: uuidv4 } = require('uuid')
const _ = require('lodash')

const colors = require('../color-util')
const { KillReport } = require('../models')

const killReportExport = async (interaction) => {
  await interaction.deferReply()

  const guildId = interaction.guildId
  const period = interaction.options.getString('period') ?? 'current-month'
  const strStartDt = interaction.options.getString('start-date')
  const strEndDt = interaction.options.getString('end-date')
  const corporations = interaction.options.getString('victim-corporations')
  const killTag = interaction.options.getString('kill-tag')

  const startDt = DateTime.fromISO(strStartDt)
  const endDt = DateTime.fromISO(strEndDt)

  let periodName = 'Lifetime'
  const where = { guildId, status: 'SUCCESS' }
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
  if (killTag) where.killTag = killTag

  const killReportIds = await KillReport.findAll({
    attributes: ['id'],
    where,
    order: [['killedAt', 'ASC']]
  })

  if (killReportIds.length > 0) {
    const headers = [
      'id',
      'lang',
      'killReportId',
      'type',
      'killTag',
      'shipType',
      'shipName',
      'isk',
      'totalDamage',
      'warpScrambleStrength',
      'participantCount',
      'region',
      'constellation',
      'system',
      'killedAt',
      'victimCorp',
      'victimName',
      'finalBlowCorp',
      'finalBlowName',
      'topDamageCorp',
      'topDamageName',
      'sourceImage.url'
    ]

    const files = []
    for (const chunk of _.chunk(_.map(killReportIds, 'id'), 50000)) {
      const killReports = await KillReport.findAll({
        where: { id: chunk},
        order: [['killedAt', 'ASC']],
        include: 'sourceImage',
      })
      const file = `./tmp/${uuidv4()}.csv`
      const reports = _.map(killReports, km => _.map(headers, h => _.get(km, h)).join(','))
      await fsp.writeFile(file, `${headers.join(',')}\n${reports.join('\n')}`)
      // files.push({ attachment: Buffer.from(`${headers.join(',')}\n${reports.join('\n')}`, 'utf-8'), name: `kill-report-export-${files.length+1}.csv` })
      files.push(file)
    }

    const embed = {
      color: colors.green,
      title: `Exporting ${killReportIds.length} kill reports`,
      description: `**Period:** ${periodName}` +
        (startDt.isValid ? `\n**Start Date:** ${startDt.toFormat(DateTime.DATETIME_SHORT)}` : '') +
        (endDt.isValid ? `\n**End Date:** ${endDt.toFormat(DateTime.DATETIME_SHORT)}` : '') +
        (corporations?.length ? `\n**Victim Corporations:** ${_.map(corporations.split(','), _.trim).join(', ')}` : '')
    }
    await interaction.editReply({ embeds: [embed], files: [{ attachment: files[0], name: 'kill-report-export-1.csv' }]})
    let i = 1
    for (const file of _.drop(files, 1)) {
      i++
      await interaction.channel.send({ files: [{ attachment: file, name: `kill-report-export-${i}.csv` }] })
    }
    _.each(files, file => fsp.unlink(file))
  } else {
    const embed = {
      color: colors.red,
      title: 'Could not find any kill reports'
    }
    await interaction.editReply({ embeds: [embed], ephemeral: true })
  }
}

module.exports = killReportExport
