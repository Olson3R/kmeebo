'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('SourceImages', 'annotations', {
      type: Sequelize.TEXT('medium'),
      allowNull: true
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('SourceImages', 'annotations', {
      type: Sequelize.TEXT,
      allowNull: true
    })
  }
};
