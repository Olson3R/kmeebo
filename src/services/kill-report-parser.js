const vision = require('@google-cloud/vision')
const crypto = require('crypto')
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const { DateTime } = require('luxon')
const sizeOf = require('image-size')
// const Fuse = require('fuse.js')
const Finder = require('homoglyph-finder')
const { Op } = require('sequelize')
const _ = require('lodash')

const GoogleAuth = require('../../config/google-cloud-credentials.json')
const Systems = require('../../config/systems.json')
const { KillReport, SourceImage } = require('../models')
const logger = require('./logger')

const ISK_X_PCT = 74.0
const ISK_Y_PCT = 29.0

const REGIONS = _.chain(Systems).map('region').uniq().value()
const KM_DIR = './kill-reports'
const RES = {
  de: {
    killReportId: /ABSCHUSSBERICHT [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    lossReportId: /VERLUSTBERICHT [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    participantCount: /Teilnehmer\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Finaler Schlag (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Höchster Schaden (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /Warp-Störungsstärke:\s*(?<value>-?\d+\.?\d?)/i,
    totalDamage: /Gesamtschaden: (?<value>[\d]+)/i,
    isk: /(?<value>\d{1,3}(,\d{3})+)/i,
    playerAndCorp: /^\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /^\s*\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}\s*UTC\s*[+-]\s*\d+)/
  },
  en: {
    killReportId: /KILL REPORT [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    lossReportId: /LOSS REPORT [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    participantCount: /Participants\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Final Blow (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Top Damage (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /Warp S[co]ramble Strength: (?<value>-?\d+\.?\d?)/i,
    totalDamage: /Total damage: (?<value>[\d]+)/i,
    isk: /(?<value>\d{1,3}(,\d{3})+)/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  es: {
    killReportId: /INFORME DE MUERTES [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    lossReportId: /INFORME DE PÉRDIDA [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    participantCount: /Participantes\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Golpe de gracia (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Daño máximo (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /impulsos: (?<value>-?\d+\.?\d?)/i,
    totalDamage: /Daño total: (?<value>[\d]+)/i,
    isk: /(?<value>\d{1,3}(,\d{3})+)/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  fr: {
    killReportId: /RAPPORT DE VICTIME [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    lossReportId: /RAPPORT DE DÉFAITE [[(][I1][D0]:(?<value>[\d]+)[\])]/i, // ???
    participantCount: /Participants\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Coup de grâce\s*(?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Meilleurs dégâts\s*(?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /Puissance d'inhibition de warp: (?<value>-?\d+\.?\d?)/i,
    totalDamage: /Dégâts totaux\s*:\s*(?<value>[\d]+)/i,
    isk: /(?<value>\d{1,3}(,\d{3})+)/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  pt: {
    killReportId: /RELATÓRIO DE ABATES [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    lossReportId: /RELATÓRIO DE DERROTA [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    participantCount: /Participantes\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Golpe final (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Maior dano (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /(Força d[ao] codificador de transpulsão|Warp S[co]ramble Strength)}:\s*(?<value>-?\d+\.?\d?)?/i,
    totalDamage: /Dano total: (?<value>[\d]+)/i,
    isk: /(?<value>\d{1,3}(,\d{3})+)/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  ru: {
    killReportId: /ОТЧЁТ О БОЕ [[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    lossReportId: /ОТЧЁТ ОБ УБЫТКАХ [[(][I1][D0]:(?<value>[\d]+)[\])]/i, // Guess
    participantCount: /Участники\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Решающий удар (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Наибольший урон (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /(варп-двигателей|Мощность варп-помех): (?<value>-?\d+\.?\d?)/i,
    totalDamage: /Общий урон: (?<value>[\d]+)/i,
    isk: /(?<value>\d{1,3}(,\d{3})+)/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  zh: {
    killReportId: /击毁报告\s*[[(][I1][D0]:(?<value>[\d]+)[\])]/i,
    lossReportId: /损失报告\s*[[(][I1][D0]:(?<value>[\d]+)[\])]/i, // Guess
    participantCount: /参与者\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /最后一击\s*(?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /造成伤害最多\s*(?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /跃迁干扰强度\s*:\s*(?<value>-?\d+\.?\d?)/i,
    totalDamage: /总伤害量\s*:\s*(?<value>[\d]+)/i,
    isk: /(?<value>\d{1,3}(,\d{3})+)/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  }
}

const TEXT = {
  de: {
    finalBlow: 'Finaler Schlag',
    topDamage: 'Höchster Schaden',
    warpScrambleStrength: ['Warp Störungsstärke', 'Warp - Störungsstärke']
  },
  en: {
    finalBlow: 'Final Blow',
    topDamage: 'Top Damage',
    warpScrambleStrength: ['Warp Scramble Strength', 'Warp Soramble Strength']
  },
  es: {
    finalBlow: 'Golpe de gracia',
    topDamage: 'Daño máximo',
    warpScrambleStrength: ['Potencia de los codificadores de']
  },
  fr: {
    finalBlow: 'Coup de grâce',
    topDamage: 'Meilleurs dégâts',
    warpScrambleStrength: ['Puissance d\'inhibition de warp']
  },
  pt: {
    finalBlow: 'Golpe final',
    topDamage: 'Maior dano',
    warpScrambleStrength: ['Força do codificador de transpulsão', 'Força da codificação de transpulsão', 'Warp Scramble Strength', 'Warp Soramble Strength']
  },
  ru: {
    finalBlow: 'Решающий удар',
    topDamage: 'Наибольший урон',
    warpScrambleStrength: ['Мощность глушения', 'Мощность варп - помех']
  },
  zh: {
    finalBlow: '最 后 一 击',
    topDamage: '总 伤 害 量',
    warpScrambleStrength: ['跃 迁 干 扰 强 度']
  }
}

const matchString = (text, possibilities, lang) => {
  const exactMatch = _.find(possibilities, p => text.includes(p))
  if (exactMatch) {
    return exactMatch
  }
  if (lang === 'zh') return null

  const partialMatch = _.get(Finder.search(text, possibilities), '0.word')
  // logger.info('Partial match', { text, possibilities, partialMatch })
  return partialMatch

  // const f = new Fuse(possibilities, { includeScore: true, threshold: 0.4 })
  // const fuzzyPossibilities = f.search(_.trim(text), { limit: 1 })
  // logger.info('Fuzzy matching', { text, possibilities, fuzzyPossibilities })
  // if (fuzzyPossibilities.length > 0) {
  //   return _.get(fuzzyPossibilities, '0.item')
  // }
}

const stringIncludesIdx = (lines, possibilities, lang) => {
  return _.findIndex(lines, line => { return line && !_.isNil(matchString(line, possibilities, lang)) })
}

const runRegExOnString = (text, re) => {
  const { groups } = re.exec(text)
  return groups
}

const closePoints = (point1, point2) => {
  if (Math.abs(point1.x - point2.x) > 16) return false
  return Math.abs(point1.y - point2.y) <= 6
}

const combineBoxes = (data) => {
  const combined = []
  let current = data[1]
  data.slice(2).forEach(n => {
    const cTopRight = current.boundingPoly.vertices[1]
    const nTopLeft = n.boundingPoly.vertices[0]
    const cBottomRight = current.boundingPoly.vertices[2]
    const nBottomLeft = n.boundingPoly.vertices[3]
    if (closePoints(cTopRight, nTopLeft) && closePoints(cBottomRight, nBottomLeft)) {
      current.description = `${current.description} ${n.description}`.trim()
      current.boundingPoly.vertices[1] = n.boundingPoly.vertices[1]
      current.boundingPoly.vertices[2] = n.boundingPoly.vertices[2]
    } else {
      combined.push(current)
      current = n
    }
  })
  combined.push(current)
  return combined
}

const regExIdx = (data, re) => {
  return _.findIndex(data, t => re.test(t))
}

const findKillReportIdIdxAndLanguage = (lines) => {
  for (const lang of Object.keys(RES)) {
    let idx = regExIdx(lines, RES[lang].killReportId)
    if (idx >= 0) return [idx, lang, 'kill']

    idx = regExIdx(lines, RES[lang].lossReportId)
    if (idx >= 0) return [idx, lang, 'loss']
  }
  return [null, null, null]
}

const parsePlayerAndCorp = (text, lang) => {
  try {
    const { groups } = RES[lang].playerAndCorp.exec(text)
    return groups
  } catch (e) {
    try {
      const { groups: corpGroups } = RES[lang].corp.exec(text)
      return { corp: corpGroups.corp, player: null }
    } catch (e2) {
      return { corp: null, player: text }
    }
  }
}

const closestVertIdx = (data, wx, wy, vertIdx, skipIndexes) => {
  let closeIdx = 0
  let closeDist = 99999999
  for (let i = 0; i < data.length; i++) {
    if (skipIndexes.includes(i)) continue

    const { x, y } = data[i].boundingPoly.vertices[vertIdx]
    const dy = wy - y
    if (dy <= 0) continue

    const dx = wx - x
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < closeDist) {
      closeIdx = i
      closeDist = dist
    }
  }

  console.log('CLOSE DIST', closeDist)
  return closeIdx
}

const findIsk = (data, iw, ih, lang) => {
  const iskPossibilities = data.filter(d => RES[lang].isk.test(d.description))
  const closeIdx = closestVertIdx(iskPossibilities, iw * ISK_X_PCT, ih * ISK_Y_PCT, 2, [])
  // console.log('ISK', iskPossibilities, closeIdx)

  return parseInt(iskPossibilities[closeIdx].description.replace(/,/g, ''))
}

const findFinalBlow = (data, lang, ships) => {
  const finalBlowIdx = _.findIndex(data, d => d.description.startsWith(TEXT[lang].finalBlow))
  if (finalBlowIdx < 0) return { corp: null, player: null }
  const skips = [finalBlowIdx]

  const finalBlowBox = data[finalBlowIdx]
  const { x: wx, y: wy } = finalBlowBox.boundingPoly.vertices[0]
  let closeIdx = closestVertIdx(data, wx, wy, 2, skips)
  const match = _.get(Finder.search(data[closeIdx].description, _.map(ships, 'name')), '0')
  if (match) {
    console.log('FINALL SHIPS NAME', data[closeIdx].description, match)
    skips.push(closeIdx)
    closeIdx = closestVertIdx(data, wx, wy, 2, skips)
  }
  if (RES[lang].participantCount.test(data[closeIdx].description)) {
    console.log('FINALL SKIP PARTICIPANT', data[closeIdx].description)
    skips.push(closeIdx)
    closeIdx = closestVertIdx(data, wx, wy, 2, skips)
  }
  console.log('FINALLL', finalBlowIdx, closeIdx, data[closeIdx].description)

  return parsePlayerAndCorp(data[closeIdx].description, lang)
}

const findTopDamage = (data, lang, ships) => {
  const topIdx = _.findIndex(data, d => d.description.startsWith(TEXT[lang].topDamage))
  if (topIdx < 0) return { corp: null, player: null }

  const top = data[topIdx]
  const { x: wx, y: wy } = top.boundingPoly.vertices[0]
  let closeIdx = closestVertIdx(data, wx, wy, 2, [topIdx])
  const match = _.get(Finder.search(data[closeIdx].description, _.map(ships, 'name')), '0')
  if (match) {
    console.log('TOPP SHIPS NAME', data[closeIdx].description, match)
    closeIdx = closestVertIdx(data, wx, wy, 2, [topIdx, closeIdx])
  }
  console.log('TOPP', topIdx, closeIdx, data[closeIdx].description)

  return parsePlayerAndCorp(data[closeIdx].description, lang)
}

const findVictim = (data, lang) => {
  const warpIdx = _.findIndex(data, d => Finder.search(d.description, TEXT[lang].warpScrambleStrength).length)
  console.log('WWWWARP', warpIdx)
  if (warpIdx < 0) return { corp: null, player: null }

  const warp = data[warpIdx]
  const { x: wx, y: wy } = warp.boundingPoly.vertices[0]
  const closeIdx = closestVertIdx(data, wx, wy, 3, [warpIdx])
  const parts = _.map(data.slice(closeIdx, warpIdx), 'description')

  return parsePlayerAndCorp(parts.join(' '), lang)
}

const parseShipAndType = (line, ships, lang) => {
  console.log('1')
  if (lang !== 'zh') {
    line = line.replace(/[^A-zÀ-úа-яА-Я ]/g, '').trim()
  }
  const shipTypes = _.chain(ships).map(ship => [ship.type, ship.enType]).uniq().value()
  console.log('2')
  const shipTypeMap = Object.fromEntries(
    shipTypes
      .concat(shipTypes.map(([t, et]) => [t.slice(0, -1), et]))
      .concat(shipTypes.map(([t, et]) => [t.slice(0, -2), et]))
  )
  console.log('3')
  const shipType = matchString(line, Object.keys(shipTypeMap), lang)
  console.log('4', line, shipType)
  if (!shipType) return [line, null]

  console.log('5')
  const enType = shipTypeMap[shipType]
  console.log('6')
  const name = matchString(line, _.chain(ships).filter({ enType }).map('name').value(), lang)
  console.log('7')
  return [_.find(ships, { name })?.enName, enType]
}

const getKillReport = async (guildId, hash, submittedBy, opts = {}) => {
  if (opts.sourceImageId) {
    const matched = await KillReport.findOne({ where: { guildId, sourceImageId: opts.sourceImageId } })
    if (matched) {
      if (opts.killTag && !matched.killTag) {
        matched.killTag = opts.killTag
        await matched.save()
      }
      return matched
    }
    return null
  }

  const sourceImage = _.first(await SourceImage.findOrCreate({
    where: { hash },
    defaults: { url: opts.url }
  }))

  const [killReport, created] = await KillReport.findOrCreate({
    where: { guildId, sourceImageId: sourceImage.id },
    defaults: {
      killTag: opts.killTag,
      submittedBy,
      messageId: opts.messageId,
      status: 'PROCESSING'
    }
  })

  if (!created) {
    if (opts.killTag && !killReport.killTag) {
      killReport.killTag = opts.killTag
      await killReport.save()
    }

    if (killReport.status !== 'SUCCESS') {
      killReport.status = 'PROCESSING'
    }
  }

  killReport.sourceImage = sourceImage

  return killReport
}

const getResult = async (killReport, imageData, ext) => {
  // Save file to disk
  const imageFile = `${KM_DIR}/${killReport.sourceImageId}${ext}`
  if (!fs.existsSync(imageFile)) {
    await fsp.writeFile(imageFile, imageData)
  }

  // Process with Google Vision API
  const googleVisionFile = `${KM_DIR}/${killReport.sourceImageId}.gv.json`
  if (fs.existsSync(googleVisionFile)) {
    const annotations = await fsp.readFile(googleVisionFile)
    return JSON.parse(annotations)
  }

  const client = new vision.ImageAnnotatorClient({ credentials: GoogleAuth })
  const [result] = await client.textDetection(imageFile)
  await fsp.writeFile(googleVisionFile, JSON.stringify(result))
  return result
}

const parseKillReport = async (guildId, submittedBy, filename, imageData, opts = {}) => {
  const hash = crypto.createHash('sha256').update(imageData).digest('base64')
  const ext = path.extname(filename)
  const sourceImageId = opts.reprocess && path.basename(filename, ext)

  const killReport = await getKillReport(
    guildId,
    hash,
    submittedBy,
    { sourceImageId, url: opts.url, killTag: opts.killTag }
  )
  if (!killReport) return null

  if (killReport.status === 'SUCCESS' && opts.reprocess !== true) {
    killReport.duplicate = true
    if (opts.killTag && !killReport.killTag) {
      killReport.killTag = opts.killTag
      await killReport.save()
    }
    return killReport
  }

  try {
    killReport.statusMessage = null

    const result = await getResult(killReport, imageData, ext)

    // Process results
    const lines = _.map(
      _.filter(result.fullTextAnnotation.text.split('\n'), t => t.length > 3),
      t => _.trim(t)
    )
    const data = _.get(result, 'textAnnotations')
    const [killReportIdIdx, lang, type] = findKillReportIdIdxAndLanguage(lines)
    if (!lang) {
      killReport.status = 'ERROR'
      killReport.statusMessage = 'Cannot determine language'
    } else {
      const combined = combineBoxes(data)
      console.log('COMBINEEE', data.length, combined.length, _.map(combined, c => ([c.description, JSON.stringify(c.boundingPoly.vertices)])))
      killReport.lang = lang
      killReport.type = type

      console.log('KILL REPORT')
      if (killReportIdIdx < 0) {
        killReport.status = 'ERROR'
        killReport.statusMessage = 'Cannot find kill report id'
      } else {
        killReport.killReportId = parseInt(_.get(runRegExOnString(lines[killReportIdIdx], RES[lang][`${type}ReportId`]), 'value'))
        lines[killReportIdIdx] = null

        const duplicateKillReport = await KillReport.findOne({
          where: {
            guildId,
            id: { [Op.not]: killReport.id },
            killReportId: killReport.killReportId,
            status: 'SUCCESS'
          }
        })
        if (duplicateKillReport) {
          logger.info('DUPLICATEEEE', { dkid: duplicateKillReport.killReportId, kid: killReport.killReportId })
          killReport.status = 'DUPLICATE'
          killReport.statusMessage = `Duplicate of ${duplicateKillReport.id}`
          await killReport.save()

          if (opts.killTag && !duplicateKillReport.killTag) {
            duplicateKillReport.killTag = opts.killTag
            await duplicateKillReport.save()
          }

          duplicateKillReport.duplicate = true
          return duplicateKillReport
        }

        const size = await sizeOf(Buffer.from(imageData))
        console.log('SSSIIIZZZEEE', size)

        console.log('SHIPS???')
        const ships = require(`../../config/ships.${lang}.json`)
        const shipTypes = _.chain(ships).map('type').uniq().value()

        console.log('PARTICIPANT COUNT')
        const participantCountIdx = regExIdx(lines, RES[lang].participantCount)
        if (participantCountIdx >= 0) {
          killReport.participantCount = parseInt(_.get(runRegExOnString(lines[participantCountIdx], RES[lang].participantCount), 'value'))
          lines[participantCountIdx] = null
        }

        console.log('WARP SCRAM STRENGTH')
        const warpScrambleStrengthIdx = regExIdx(lines, RES[lang].warpScrambleStrength)
        if (warpScrambleStrengthIdx >= 0) {
          killReport.warpScrambleStrength = parseFloat(_.get(runRegExOnString(lines[warpScrambleStrengthIdx], RES[lang].warpScrambleStrength), 'value'))
          lines[warpScrambleStrengthIdx] = null
        }

        console.log('TOTAL DAMAGE')
        const totalDamageIdx = regExIdx(lines, RES[lang].totalDamage)
        if (totalDamageIdx >= 0) {
          killReport.totalDamage = parseInt(_.get(runRegExOnString(lines[totalDamageIdx], RES[lang].totalDamage), 'value'))
          lines[totalDamageIdx] = null
        }

        console.log('ISK')
        // const iskIdx = regExIdx(lines, RES[lang].isk)
        // if (iskIdx >= 0) {
        //   const v = runRegExOnString(lines[iskIdx], RES[lang].isk)
        //   killReport.isk = parseInt(_.get(v, 'value').replace(/,/g, ''))
        //   lines[iskIdx] = null
        // }
        killReport.isk = findIsk(combined, size.width, size.height, lang)
        // console.log('ISKIESSS', killReport.isk)

        console.log('SHIP')
        const shipIdx = stringIncludesIdx(lines, lang === 'zh' ? shipTypes : shipTypes.concat(shipTypes.map(t => t.slice(0, -1))).concat(shipTypes.map(t => t.slice(0, -2))), lang)
        console.log('SHIP IDX', shipIdx)
        if (shipIdx >= 0) {
          const [shipName, shipType] = parseShipAndType(lines[shipIdx], ships, lang)
          killReport.shipType = shipType
          killReport.shipName = shipName
          lines[shipIdx] = null
        }

        console.log('TIME')
        const timeIdx = regExIdx(lines, RES[lang].time)
        if (timeIdx >= 0) {
          const tRaw = _.get(runRegExOnString(lines[timeIdx], RES[lang].time), 'value').replace(/UTC\s*/, '')
          killReport.killedAt = DateTime.fromFormat(tRaw, 'yyyy/MM/dd HH:mm:ss Z', { zone: 'UTC' })
          lines[timeIdx] = null
        }

        console.log('LOCATION')
        const locationLines = _.filter(lines, line => line && line.match(/</))
        const locationLineIdx = stringIncludesIdx(_.map(locationLines, l => _.trim(_.last(_.split(l, '<')))), REGIONS)
        if (locationLineIdx >= 0) {
          const locationIdx = _.findIndex(lines, l => l === locationLines[locationLineIdx])
          if (locationIdx >= 0) {
            let location = lines[locationIdx]
            lines[locationIdx] = null
            killReport.location = location
            killReport.region = matchString(_.trim(_.last(_.split(location, '<'))), REGIONS, lang)
            if (killReport.region) {
              location = location.trim().slice(0, -killReport.region.length).replace(/\s*<\s*\w{0,2}\s*$/, '')
              const constellations = _.chain(Systems)
                .filter({ region: killReport.region })
                .map('constellation')
                .uniq()
                .value()
              killReport.constellation = matchString(_.trim(_.last(_.split(location, '<'))), constellations, lang)
              if (killReport.constellation) {
                location = location.replace(killReport.constellation, '').replace(/\s*<\s*\w{0,2}\s*$/, '')
                const systemNames = _.chain(Systems)
                  .filter({ region: killReport.region, constellation: killReport.constellation })
                  .map('name')
                  .value()
                killReport.system = matchString(location, systemNames, lang)
                if (!killReport.system) {
                  const systemIdx = stringIncludesIdx(lines, systemNames)
                  if (systemIdx >= 0) {
                    killReport.system = matchString(lines[systemIdx], systemNames, lang)
                    lines[systemIdx] = null
                  }
                }
              }
            }
          }
        }

        console.log('FINAL BLOW')
        const { corp: finalBlowCorp, player: finalBlowName } = findFinalBlow(combined, lang, ships)
        killReport.finalBlowCorp = finalBlowCorp
        killReport.finalBlowName = finalBlowName

        console.log('TOP DAMAGE')
        const { corp: topDamageCorp, player: topDamageName } = findTopDamage(combined, lang, ships)
        killReport.topDamageCorp = topDamageCorp
        killReport.topDamageName = topDamageName

        console.log('VICTIM')
        const { corp: victimCorp, player: victimName } = findVictim(combined, lang)
        if (killReport.shipType === 'Corporation Citadel') {
          killReport.victimCorp = victimName
        } else {
          killReport.victimCorp = victimCorp
          killReport.victimName = victimName
        }

        killReport.status = 'SUCCESS'
      }
    }
  } catch (e) {
    logger.error('Failed to parse kill report', { error: e.message, stackTrace: e.stack })
    killReport.status = 'ERROR'
    killReport.statusMessage = e.message
  }
  await killReport.save()

  return killReport
}

module.exports = parseKillReport
