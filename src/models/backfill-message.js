module.exports = (sequelize, DataTypes) => {
  const BackfillMessage = sequelize.define('BackfillMessage', {
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
    messageId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imageUrls: {
      type: DataTypes.STRING(65532),
      allowNull: false
    },
    imageCount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['guildId'] },
      { fields: ['messageId'] },
      { fields: ['status'] }
    ]
  })

  return BackfillMessage
}
