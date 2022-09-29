module.exports = (sequelize, DataTypes) => {
  const SourceImage = sequelize.define('SourceImage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['hash'] }
    ]
  })

  SourceImage.associate = ({ KillReport }) => {
    SourceImage.hasMany(KillReport)
  }

  return SourceImage
}
