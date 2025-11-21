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
      }
    ]
  });

  return Screenshot;
};

export default Screenshot;
