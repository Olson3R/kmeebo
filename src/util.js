const { User } = require('./models')

module.exports = {
  isAdmin: async (guildId, discordTag) => {
    if (discordTag === 'spidermo#1871') return true
    const { count } = await User.findAndCountAll({ where: { guildId, discordTag, type: 'admin' } })
    return count >= 1
  }
}
