'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('SourceImages', 'annotations')
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('SourceImages', 'annotations', {
      type: Sequelize.TEXT('medium'),
      allowNull: true
    })
  }
};
