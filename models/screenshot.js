const Screenshot = (sequelize, DataTypes) => {
  const Screenshot = sequelize.define('Screenshot', {
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
    file_path: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_path'
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'file_size'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'width'
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'height'
    },
    format: {
      type: DataTypes.STRING,
      defaultValue: 'webp',
      field: 'format'
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_archived'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'metadata'
    },
    processing_status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
      field: 'processing_status'
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at'
    },
    ai_analysis: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'ai_analysis'
    },
    processing_error: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'processing_error'
    },
    focus_session_id: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'focus_session_id',
      references: {
        model: 'focus_sessions',
        key: 'id'
      }
    }
  }, {
    timestamps: false,
    tableName: 'screenshots',
    freezeTableName: true,
    underscored: true,
    hooks: {
      beforeCreate: (screenshot) => {
        screenshot.created_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['isArchived']
      },
      {
        fields: ['processing_status']
      },
      {
        fields: ['processed_at']
      },
      {
        fields: ['user_id', 'processing_status']
      }
    ]
  });

  return Screenshot;
};

export default Screenshot;
