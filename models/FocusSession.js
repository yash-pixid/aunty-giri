const FocusSession = (sequelize, DataTypes) => {
  const FocusSession = sequelize.define('FocusSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'id'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Session configuration
    goal: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'goal'
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'subject'
    },
    planned_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'planned_duration'
    },
    session_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'custom',
      field: 'session_type'
    },
    // Session timeline
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time'
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
    },
    actual_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'actual_duration'
    },
    // Session state
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      field: 'status'
    },
    pause_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'pause_count'
    },
    total_pause_duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_pause_duration'
    },
    // Focus metrics
    focus_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'focus_score'
    },
    productivity_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'productivity_score'
    },
    distraction_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'distraction_count'
    },
    app_switches: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'app_switches'
    },
    // Activity breakdown (in seconds)
    productive_time: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'productive_time'
    },
    neutral_time: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'neutral_time'
    },
    distracting_time: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'distracting_time'
    },
    // AI insights aggregation
    ai_summary: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'ai_summary'
    },
    // Metadata
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notes'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'focus_sessions',
    freezeTableName: true,
    underscored: true,
    hooks: {
      beforeCreate: (session) => {
        session.created_at = new Date();
        session.updated_at = new Date();
      },
      beforeUpdate: (session) => {
        session.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['start_time']
      },
      {
        fields: ['user_id', 'status']
      }
    ]
  });

  return FocusSession;
};

export default FocusSession;
