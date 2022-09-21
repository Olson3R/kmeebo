'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('KillReports', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      guildId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      killReportId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      killedAt: {
        type: Sequelize.DATE
      },
      shipType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shipName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      constellation: {
        type: Sequelize.STRING,
        allowNull: true
      },
      region: {
        type: Sequelize.STRING,
        allowNull: true
      },
      system: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isk: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      warpScrambleStrength: {
        type: Sequelize.DECIMAL(15,1),
        allowNull: true
      },
      totalDamage: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      participantCount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      victimCorp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      victimName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      finalBlowCorp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      finalBlowName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      topDamageCorp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      topDamageName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sourceImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      submittedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lang: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true
      },
      statusMessage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
    // await queryInterface.addIndex('KillReports', { fields: ['guildId'] })
    // await queryInterface.addIndex('KillReports', { fields: ['killReportId'] })
    // await queryInterface.addIndex('KillReports', { fields: ['shipType'] })
    // await queryInterface.addIndex('KillReports', { fields: ['shipName'] })
    // await queryInterface.addIndex('KillReports', { fields: ['victimCorp'] })
    // await queryInterface.addIndex('KillReports', { fields: ['victimName'] })
    // await queryInterface.addIndex('KillReports', { fields: ['finalBlowCorp'] })
    // await queryInterface.addIndex('KillReports', { fields: ['finalBlowName'] })
    // await queryInterface.addIndex('KillReports', { fields: ['topDamageCorp'] })
    // await queryInterface.addIndex('KillReports', { fields: ['topDamageName'] })
    // await queryInterface.addIndex('KillReports', { fields: ['location'] })
    // await queryInterface.addIndex('KillReports', { fields: ['constellation'] })
    // await queryInterface.addIndex('KillReports', { fields: ['region'] })
    // await queryInterface.addIndex('KillReports', { fields: ['system'] })
    // await queryInterface.addIndex('KillReports', { fields: ['submittedBy'] })
    // await queryInterface.addIndex('KillReports', { fields: ['status'] })
    // await queryInterface.addIndex('KillReports', { fields: ['hash'] })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('KillReports')
  }
};
