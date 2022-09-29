'use strict'

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('SourceImages', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      url: {
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

    await queryInterface.addColumn('KillReports', 'sourceImageId', Sequelize.STRING)

    await queryInterface.sequelize.query("insert into SourceImages(id, hash, url) select uuid(), hash, sourceImage from KillReports where sourceImage is not null")
    await queryInterface.sequelize.query("update KillReports inner join SourceImages on SourceImages.hash = KillReports.hash and SourceImages.url = KillReports.sourceImage set sourceImageId = SourceImages.id")
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('KillReports', 'sourceImageId')
    await queryInterface.dropTable('SourceImages')
  }
}
