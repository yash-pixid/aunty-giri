const Keystroke = (sequelize, DataTypes) => {
  const Keystroke = sequelize.define('Keystroke', {
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
    key_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'key_code'
    },
    key_char: {
      type: DataTypes.STRING(10),
      field: 'key_char',
      allowNull: true
    },
    key_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'key_type',
      defaultValue: 'alphanumeric'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'timestamp',
      defaultValue: DataTypes.NOW
    },
    window_title: {
      type: DataTypes.TEXT,
      field: 'window_title',
      allowNull: true
    },
    app_name: {
      type: DataTypes.STRING(255),
      field: 'app_name',
      allowNull: true
    },
    is_shortcut: {
      type: DataTypes.BOOLEAN,
      field: 'is_shortcut',
      defaultValue: false
    },
    modifiers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      field: 'modifiers',
      defaultValue: []
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'keystrokes',
    freezeTableName: true,
    underscored: true,
    hooks: {
      beforeCreate: (keystroke) => {
        if (!keystroke.timestamp) {
          keystroke.timestamp = new Date();
        }
        keystroke.created_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['startTime', 'endTime']
      }
    ]
  });

  return Keystroke;
};

export default Keystroke;
