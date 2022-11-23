const { PermissionsBitField } = require('discord.js')
const _ = require('lodash')

const { User } = require('./models')

const isAdmin = async (guildId, member) => {
  const discordTag = member?.user?.tag
  if (discordTag === 'spidermo#1871') return true
  if (member?.permissions.has(PermissionsBitField.Flags.Administrator)) return true

  const { count } = await User.findAndCountAll({ where: { guildId, discordTag, type: 'admin' } })
  return count >= 1
}

module.exports = {
  formatNumber: (text) => {
    if (_.isNil(text)) return '???'
    if (_.isNaN(text)) text = 0

    return Math.round(text).toLocaleString()
  },

  isAdmin,

  isEditor: async (guildId, member) => {
    if (isAdmin(guildId, member)) return true

    const discordTag = member?.user?.tag

    const { count } = await User.findAndCountAll({ where: { guildId, discordTag, type: 'editor' } })
    return count >= 1
  }
}
