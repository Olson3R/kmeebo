const colors = require('../color-util')
const { isAdmin } = require('../util')
const { User } = require('../models')

const adminRemoveAdmin = async (interaction) => {
  const guildId = interaction.guildId
  const interactionUserTag = interaction.user.tag
  if (!(await isAdmin(guildId, interactionUserTag))) {
    const embed = {
      color: colors.red,
      title: 'Not An Admin',
      description: 'Admin permission is required for this command.'
    }
    await interaction.reply({ embeds: [embed] })
    return
  }

  const userToRemove = interaction.options.getUser('user')

  try {
    const user = await User.findOne({ where: { guildId, discordTag: userToRemove.tag } })
    if (user) {
      await user.destroy()

      const embed = {
        color: colors.green,
        title: 'Removed Admin',
        description: `The user \`${user.discordTag}\` will no longer be able to use admin commands.`
      }
      await interaction.reply({ embeds: [embed] })
    } else {
      const embed = {
        color: colors.green,
        title: 'Admin Not Found',
        description: `User \`${userToRemove.tag}\` is not an admin.`
      }
      await interaction.reply({ embeds: [embed] })
    }
  } catch (e) {
    const embed = {
      color: colors.red,
      title: 'Error Removing Admin',
      description: e.message
    }
    await interaction.reply({ embeds: [embed] })
  }
}

module.exports = adminRemoveAdmin
