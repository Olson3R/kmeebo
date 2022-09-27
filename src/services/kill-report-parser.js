const vision = require('@google-cloud/vision')
const crypto = require('crypto')
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const { DateTime } = require('luxon')
// const Fuse = require('fuse.js')
const Finder = require('homoglyph-finder')
const { Op } = require('sequelize')
const _ = require('lodash')

const GoogleAuth = require('../../config/google-cloud-credentials.json')
const Systems = require('../../config/systems.json')
const { KillReport } = require('../models')
const logger = require('./logger')

const REGIONS = _.chain(Systems).map('region').uniq().value()
const KM_DIR = './kill-reports'
const RES = {

  de: {
    killReportId: /ABSCHUSSBERICHT [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i,
    lossReportId: /VERLUSTBERICHT [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i,
    participantCount: /Teilnehmer\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Finaler Schlag (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Höchster Schaden (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /Warp-Störungsstärke:\s*(?<value>-?\d+\.?\d?)/i,
    totalDamage: /Gesamtschaden: (?<value>[\d]+)/i,
    isk: /(?<value>[\d,]+) ISK/i,
    playerAndCorp: /^\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /^\s*\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  en: {
    killReportId: /KILL REPORT [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i,
    lossReportId: /LOSS REPORT [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i,
    participantCount: /Participants\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Final Blow (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Top Damage (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /Warp S[co]ramble Strength: (?<value>-?\d+\.?\d?)/i,
    totalDamage: /Total damage: (?<value>[\d]+)/i,
    isk: /(?<value>[\d,]+) ISK/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  es: {
    killReportId: /INFORME DE MUERTES [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i,
    lossReportId: /INFORME DE PÉRDIDA [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i, // Guess
    participantCount: /Participantes\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Golpe de gracia (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Daño máximo (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /impulsos: (?<value>-?\d+\.?\d?)/i,
    totalDamage: /Daño total: (?<value>[\d]+)/i,
    isk: /(?<value>[\d,]+) ISK/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  pt: {
    killReportId: /RELATÓRIO DE ABATES [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i,
    lossReportId: /RELATÓRIO DE DERROTA [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i,
    participantCount: /Participantes\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Golpe final (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Maior dano (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /(Força d[ao] codificador de transpulsão|Warp S[co]ramble Strength)}:\s*(?<value>-?\d+\.?\d?)?/i,
    totalDamage: /Dano total: (?<value>[\d]+)/i,
    isk: /(?<value>[\d,]+) ISK/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  ru: {
    killReportId: /ОТЧЁТ О БОЕ [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i,
    lossReportId: /ОТЧЁТ ОБ УБЫТКАХ [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i, // Guess
    participantCount: /Участники\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /Решающий удар (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Наибольший урон (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /варп-двигателей: (?<value>-?\d+\.?\d?)/i,
    totalDamage: /Общий урон: (?<value>[\d]+)/i,
    isk: /(?<value>[\d,]+) ISK/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  },
  zh: {
    killReportId: /击毁报告 [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i,
    lossReportId: /损失报告 [\[\(][I1][D0]:(?<value>[\d]+)[\]\)]/i, // Guess
    participantCount: /参与者\s*\[\s*(?<value>[\d]+)\s*\]/i,
    finalBlow: /最后一击 (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    topDamage: /Наибольший урон (?<damage>[\d]+) (?<percent>[\d]+)%/i,
    warpScrambleStrength: /跃迁干扰强度: (?<value>-?\d+\.?\d?)/i,
    totalDamage: /总伤害量: (?<value>[\d]+)/i,
    isk: /(?<value>[\d,]+) ISK/i,
    playerAndCorp: /\[\s*(?<corp>\w+)\s*\]\s*(?<player>.+)/,
    corp: /\[\s*(?<corp>\w+)\s*\]\s*/,
    time: /(?<value>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} UTC\s*[+-]\d+)/
  }
}

const TEXT = {
  de: {
    finalBlow: 'Finaler Schlag',
    topDamage: 'Höchster Schaden',
    warpScrambleStrength: ['Warp Störungsstärke']
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
  pt: {
    finalBlow: 'Golpe final',
    topDamage: 'Maior dano',
    warpScrambleStrength: ['Força do codificador de transpulsão', 'Força da codificação de transpulsão', 'Warp Scramble Strength', 'Warp Soramble Strength']
  },
  ru: {
    finalBlow: 'Решающий удар',
    topDamage: 'Наибольший урон',
    warpScrambleStrength: ['Мощность глушения']
  },
  zh: {
    finalBlow: '最后一击',
    topDamage: '???',
    warpScrambleStrength: ['跃迁干扰强度']
  }
}

const matchString = (text, possibilities) => {
  const exactMatch = _.find(possibilities, p => text.includes(p))
  if (exactMatch) {
    return exactMatch
  }

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

const stringIncludesIdx = (lines, possibilities) => {
  return _.findIndex(lines, line => { return line && !_.isNil(matchString(line, possibilities)) })
}

const runRegExOnString = (text, re) => {
  const { groups } = re.exec(text)
  return groups
}

const closePoints = (point1, point2) => {
  if (Math.abs(point1.x - point2.x) > 16) return false
  return Math.abs(point1.y - point2.y) <= 3
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
    }
    else {
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
  }
  catch(e) {
    try {
      const { groups: corpGroups } = RES[lang].corp.exec(text)
      return { corp: corpGroups.corp, player: null }
    }
    catch(e2) {
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

const findFinalBlow = (data, lang, ships) => {
  let finalBlowIdx = _.findIndex(data, d => d.description.startsWith(TEXT[lang].finalBlow))
  if (finalBlowIdx < 0) return { corp: null, player: null }
  const skips = [finalBlowIdx]

  const top = data[finalBlowIdx]
  const { x: wx, y: wy } = top.boundingPoly.vertices[0]
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
  let topIdx = _.findIndex(data, d => d.description.startsWith(TEXT[lang].topDamage))
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
  let warpIdx = _.findIndex(data, d => Finder.search(d.description, TEXT[lang].warpScrambleStrength).length)
  console.log('WWWWARP', warpIdx)
  if (warpIdx < 0) return { corp: null, player: null }

  const warp = data[warpIdx]
  const { x: wx, y: wy } = warp.boundingPoly.vertices[0]
  const closeIdx = closestVertIdx(data, wx, wy, 3, [warpIdx])
  const parts = _.map(data.slice(closeIdx, warpIdx), 'description')

  return parsePlayerAndCorp(parts.join(' '), lang)
}

const parseShipAndType = (line, ships) => {
  line = line.replace(/[^a-zA-Z ]/g, '').trim()
  const shipTypes = _.chain(ships).map(ship =>[ship.type, ship.enType]).uniq().value()
  const shipTypeMap = Object.fromEntries(
    shipTypes
      .concat(shipTypes.map(([t, et]) => [t.slice(0, -1), et]))
      .concat(shipTypes.map(([t, et]) => [t.slice(0, -2), et]))
  )
  const shipType = matchString(line, Object.keys(shipTypeMap))
  console.log('SHIPPPP', shipType)
  if (!shipType) return [line, null]

  const name = matchString(line, _.map(ships, 'name'))
  return [_.find(ships, { name })?.enName, shipTypeMap[shipType]]
}

const getKillReport = async (guildId, hash, submittedBy, opts = {}) => {
  if (opts.id) {
    const matched =  await KillReport.findOne({ where: { guildId, id: opts.id }})
    if (matched) {
      if (opts.killTag && !matched.killTag) {
        matched.killTag = opts.killTag
        await matched.save()
      }
      return matched
    }
  }
  else {
    const matched = await KillReport.findOne({ where: { guildId, hash, status: 'SUCCESS' } })
    if (matched) {
      if (opts.killTag && !matched.killTag) {
        matched.killTag = opts.killTag
        await matched.save()
      }
      return matched
    }
  }

  return KillReport.create({
    id: opts.id,
    guildId,
    sourceImage: opts.url,
    killTag: opts.killTag,
    submittedBy,
    hash,
    status: 'PROCESSING'
  })
}

const getResult = async (killReport, imageData, ext) => {
  // Save file to disk
  const imageFile = `${KM_DIR}/${killReport.id}${ext}`
  if (!fs.existsSync(imageFile)) {
    await fsp.writeFile(imageFile, imageData)
  }

  // Process with Google Vision API
  const googleVisionFile = `${KM_DIR}/${killReport.id}.gv.json`
  if (fs.existsSync(googleVisionFile)) {
    return JSON.parse(await fsp.readFile(googleVisionFile))
  }
  else {
    const client = new vision.ImageAnnotatorClient({ credentials: GoogleAuth });
    const [result] = await client.textDetection(imageFile);
    await fsp.writeFile(googleVisionFile, JSON.stringify(result))
    return result
  }
}

const parseKillReport = async (guildId, submittedBy, filename, imageData, opts = {}) => {
  const hash = crypto.createHash('sha256').update(imageData).digest('base64')
  // logger.info(`HASHHH`, { hash, filename })
  const ext = path.extname(filename)
  const id = opts.reprocess && path.basename(filename, ext)

  const killReport = await getKillReport(
    guildId,
    hash,
    submittedBy,
    { id, url: opts.url, killTag: opts.killTag })

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
    }
    else {
      const combined = combineBoxes(data)
      // console.log('COMBINEEE', data.length, combined.length, combined)
      killReport.lang = lang
      killReport.type = type

      if (killReportIdIdx < 0) {
        killReport.status = 'ERROR'
        killReport.statusMessage = 'Cannot find kill report id'
      }
      else {
        killReport.killReportId = parseInt(_.get(runRegExOnString(lines[killReportIdIdx], RES[lang][`${type}ReportId`]), 'value'))
        lines[killReportIdIdx] = null

        const duplicateKillReport = await KillReport.findOne({ where: {
          guildId,
          id: { [Op.not]: killReport.id },
          killReportId: killReport.killReportId,
          status: 'SUCCESS'
        }})
        if (duplicateKillReport) {
          logger.info("DUPLICATEEEE", { dkid: duplicateKillReport.killReportId, kid: killReport.killReportId })
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

        const ships = require(`../../config/ships.${lang}.json`)
        shipTypes = _.chain(ships).map('type').uniq().value()

        const participantCountIdx = regExIdx(lines, RES[lang].participantCount)
        if (participantCountIdx >= 0) {
          killReport.participantCount = parseInt(_.get(runRegExOnString(lines[participantCountIdx], RES[lang].participantCount), 'value'))
          lines[participantCountIdx] = null
        }

        const warpScrambleStrengthIdx = regExIdx(lines, RES[lang].warpScrambleStrength)
        if (warpScrambleStrengthIdx >= 0) {
          killReport.warpScrambleStrength = parseFloat(_.get(runRegExOnString(lines[warpScrambleStrengthIdx], RES[lang].warpScrambleStrength), 'value'))
          lines[warpScrambleStrengthIdx] = null
        }

        const totalDamageIdx = regExIdx(lines, RES[lang].totalDamage)
        if (totalDamageIdx >= 0) {
          killReport.totalDamage = parseInt(_.get(runRegExOnString(lines[totalDamageIdx], RES[lang].totalDamage), 'value'))
          lines[totalDamageIdx] = null
        }

        const iskIdx = regExIdx(lines, RES[lang].isk)
        if (iskIdx >= 0) {
          const v = runRegExOnString(lines[iskIdx], RES[lang].isk)
          killReport.isk = parseInt(_.get(v, 'value').replace(/,/g, ''))
          lines[iskIdx] = null
        }

        const shipIdx = stringIncludesIdx(lines, shipTypes.concat(shipTypes.map(t => t.slice(0, -1))).concat(shipTypes.map(t => t.slice(0, -2))))
        console.log('SHIP IDX', shipIdx)
        if (shipIdx >= 0) {
          const [shipName, shipType] = parseShipAndType(lines[shipIdx], ships)
          killReport.shipType = shipType
          killReport.shipName = shipName
          lines[shipIdx] = null
        }

        const timeIdx = regExIdx(lines, RES[lang].time)
        if (timeIdx >= 0) {
          const tRaw = _.get(runRegExOnString(lines[timeIdx], RES[lang].time), 'value').replace(/UTC\s*/, '')
          killReport.killedAt = DateTime.fromFormat(tRaw, 'yyyy/MM/dd HH:mm:ss Z', { zone: 'UTC' })
          lines[timeIdx] = null
        }

        const locationLines = _.filter(lines, line => line && line.match(/\</))
        const locationLineIdx = stringIncludesIdx(_.map(locationLines, l => _.trim(_.last(_.split(l, '<')))), REGIONS)
        if (locationLineIdx >= 0) {
          const locationIdx = _.findIndex(lines, l => l === locationLines[locationLineIdx])
          if (locationIdx >= 0) {
            let location = lines[locationIdx]
            lines[locationIdx] = null
            killReport.location = location
            killReport.region = matchString(_.trim(_.last(_.split(location, '<'))), REGIONS)
            if (killReport.region) {
              location = location.trim().slice(0, -killReport.region.length).replace(/\s*\<\s*\w{0,2}\s*$/, '')
              const constellations = _.chain(Systems)
                .filter({ region: killReport.region })
                .map('constellation')
                .uniq()
                .value()
              killReport.constellation = matchString(_.trim(_.last(_.split(location, '<'))), constellations)
              if (killReport.constellation) {
                location = location.replace(killReport.constellation, '').replace(/\s*\<\s*\w{0,2}\s*$/, '')
                const systemNames = _.chain(Systems)
                  .filter({ region: killReport.region, constellation: killReport.constellation })
                  .map('name')
                  .value()
                killReport.system = matchString(location, systemNames)
                if (!killReport.system) {
                  const systemIdx = stringIncludesIdx(lines, systemNames)
                  if (systemIdx >= 0) {
                    killReport.system = matchString(lines[systemIdx], systemNames)
                    lines[systemIdx] = null
                  }
                }
              }
            }
          }
        }

        const { corp: finalBlowCorp, player: finalBlowName } = findFinalBlow(combined, lang, ships)
        killReport.finalBlowCorp = finalBlowCorp
        killReport.finalBlowName = finalBlowName

        const { corp: topDamageCorp, player: topDamageName } = findTopDamage(combined, lang, ships)
        killReport.topDamageCorp = topDamageCorp
        killReport.topDamageName = topDamageName

        const { corp: victimCorp, player: victimName } = findVictim(combined, lang)
        if (killReport.shipType === 'Corporation Citadel') {
          killReport.victimCorp = victimName
        }
        else {
          killReport.victimCorp = victimCorp
          killReport.victimName = victimName
        }

        killReport.status = 'SUCCESS'
      }
    }
  }
  catch(e) {
    logger.error('Failed to parse kill report', { error: e.message, stackTrace: e.stack })
    killReport.status = 'ERROR'
    killReport.statusMessage = e.message

  }
  await killReport.save()

  return killReport
}

module.exports = parseKillReport
