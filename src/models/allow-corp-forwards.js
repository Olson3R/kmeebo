module.exports = (sequelize, DataTypes) => {
  const AllowCorpForward = sequelize.define('AllowCorpForward', {
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
    corpGuildId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    forwardableChannelId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['guildId'] },
      { fields: ['corpGuildId'] },
      { fields: ['forwardableChannelId'] }
    ]
  })

  return AllowCorpForward
}
