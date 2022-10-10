const _ = require('lodash')

const colors = require('../color-util')
const { isAdmin } = require('../util')
const { User } = require('../models')

const adminAddAdmin = async (interaction) => {
  const guildId = interaction.guildId
  const updatedBy = interaction.user.tag
  if (!(await isAdmin(guildId, interaction.member))) {
    const embed = {
      color: colors.red,
      title: 'Not An Admin',
      description: 'Admin permission is required for this command.'
    }
    await interaction.reply({ embeds: [embed] })
    return
  }

  const userToAdd = interaction.options.getUser('user')

  try {
    const user = _.first(await User.findOrCreate({
      where: { guildId, discordTag: userToAdd.tag },
      defaults: { updatedBy, type: 'admin' }
    }))
    user.updatedBy = updatedBy
    user.type = 'admin'
    await user.save()

    const fields = [
      { name: 'User', value: user.discordTag },
      { name: 'Type', value: user.type }
    ]

    const embed = {
      color: colors.green,
      title: 'Added Admin User',
      description: 'This user can now use admin commands.',
      footer: { text: user.id },
      fields
    }
    await interaction.reply({ embeds: [embed] })
  } catch (e) {
    const embed = {
      color: colors.red,
      title: 'Error Adding Admin User',
      description: e.message
    }
    await interaction.reply({ embeds: [embed] })
  }
}

module.exports = adminAddAdmin
