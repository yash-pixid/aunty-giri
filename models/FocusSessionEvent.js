const FocusSessionEvent = (sequelize, DataTypes) => {
  const FocusSessionEvent = sequelize.define('FocusSessionEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'id'
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'session_id',
      references: {
        model: 'focus_sessions',
        key: 'id'
      }
    },
    event_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'event_type'
    },
    event_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'event_data'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'timestamp',
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'focus_session_events',
    freezeTableName: true,
    underscored: true,
    hooks: {
      beforeCreate: (event) => {
        event.timestamp = event.timestamp || new Date();
        event.created_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['session_id']
      },
      {
        fields: ['event_type']
      }
    ]
  });

  return FocusSessionEvent;
};

export default FocusSessionEvent;
