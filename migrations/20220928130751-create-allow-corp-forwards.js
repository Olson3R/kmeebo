'use strict'

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('AllowCorpForwards', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      guildId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      forwardableChannelId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      corpGuildId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      updatedBy: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('AllowCorpForwards')
  }
}
