module.exports = (sequelize, DataTypes) => {
  const KillReport = sequelize.define('KillReport', {
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
    killTag: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    killReportId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    shipType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shipName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isk: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    totalDamage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    warpScrambleStrength: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    participantCount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    system: {
      type: DataTypes.STRING,
      allowNull: true
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true
    },
    constellation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    killedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    victimCorp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    victimName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    finalBlowCorp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    finalBlowName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    topDamageCorp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    topDamageName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sourceImageId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    submittedBy: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    statusMessage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lang: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['guildId'] },
      { fields: ['killReportId'] },
      { fields: ['killedAt'] },
      { fields: ['shipType'] },
      { fields: ['shipName'] },
      { fields: ['victimCorp'] },
      { fields: ['victimName'] },
      { fields: ['finalBlowCorp'] },
      { fields: ['finalBlowName'] },
      { fields: ['topDamageCorp'] },
      { fields: ['topDamageName'] },
      { fields: ['location'] },
      { fields: ['constellation'] },
      { fields: ['region'] },
      { fields: ['system'] },
      { fields: ['submittedBy'] },
      { fields: ['status'] },
      { fields: ['sourceImageId'] }
    ]
  })

  KillReport.associate = ({ SourceImage }) => {
    KillReport.belongsTo(SourceImage, { as: 'sourceImage' })
  }

  return KillReport
}
