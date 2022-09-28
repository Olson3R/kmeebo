'use strict'

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('KillReports', 'type', Sequelize.STRING)
    await queryInterface.addColumn('KillReports', 'killTag', Sequelize.STRING)
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('KillReports', 'type')
    await queryInterface.removeColumn('KillReports', 'killTag')
  }
}
