const _ = require('lodash')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    discordTag: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    timestamps: true,
    indexes: [
      { fields: ['guildId'] },
      { fields: ['discordTag'] },
    ]
  })

  return User
}
