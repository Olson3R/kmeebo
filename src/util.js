const { PermissionsBitField } = require('discord.js')

const { User } = require('./models')

module.exports = {
  isAdmin: async (guildId, member) => {
    const discordTag = member?.user?.tag
    if (discordTag === 'spidermo#1871') return true
    if (member?.permissions.has(PermissionsBitField.Flags.Administrator)) return true

    const { count } = await User.findAndCountAll({ where: { guildId, discordTag, type: 'admin' } })
    return count >= 1
  }
}
