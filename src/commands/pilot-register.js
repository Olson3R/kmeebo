const colors = require('../color-util')
const { Pilot } = require('../models')

const pilotRegister = async (interaction) => {
  const guildId = interaction.guildId
  const discordTag = interaction.user.tag
  const name = interaction.options.getString('name')

  try {
    const existingPilot = await Pilot.findOne({ where: { guildId, name } })
    if (existingPilot) {
      const fields = [
        { name: 'Pilot', value: existingPilot.name },
        { name: 'Discord User', value: existingPilot.discordTag }
      ]
      const embed = {
        color: colors.red,
        title: 'Pilot Already Exists',
        fields,
        footer: { text: existingPilot.id }
      }
      await interaction.reply({ embeds: [embed] })
      return
    }

    const pilot = await Pilot.create({ guildId, discordTag, name, updatedBy: discordTag })
    const fields = [
      { name: 'Pilot', value: pilot.name },
      { name: 'Discord User', value: pilot.discordTag }
    ]
    const embed = {
      color: colors.greed,
      title: 'Pilot Registered',
      fields,
      footer: { text: pilot.id }
    }
    await interaction.reply({ embeds: [embed] })
  } catch (e) {
    const embed = {
      color: colors.red,
      title: 'Error Registering Pilot',
      description: e.message
    }
    await interaction.reply({ embeds: [embed] })
  }
}

module.exports = pilotRegister
