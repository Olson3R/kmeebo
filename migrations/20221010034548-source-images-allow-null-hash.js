'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.createTable('BackfillMessages', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      guildId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      messageId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      imageUrls: {
        type: Sequelize.STRING(65532),
        allowNull: false
      },
      imageCount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdBy: {
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
    await queryInterface.changeColumn('SourceImages', 'hash', {
      type: Sequelize.STRING,
      allowNull: true // note this
    })
    await queryInterface.addColumn('SourceImages', 'annotations', {
      type: Sequelize.TEXT,
      allowNull: true
    })
    await queryInterface.addColumn('KillReports', 'messageId', {
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.removeColumn('KillReports', 'sourceImage')
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('BackfillMessages')
    await queryInterface.changeColumn('SourceImages', 'hash', {
      type: Sequelize.STRING,
      allowNull: false
    })
    await queryInterface.removeColumn('SourceImages', 'annotations')
    await queryInterface.removeColumn('KillReports', 'messageId')
    await queryInterface.addColumn('KillReports', 'sourceImage', {
      type: Sequelize.STRING,
      allowNull: true
    })
  }
};
