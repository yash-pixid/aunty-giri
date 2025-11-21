const Activity = (sequelize, DataTypes) => {
  const Activity = sequelize.define('Activity', {
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
    window_title: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'window_title'
    },
    app_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'app_name'
    },
    url: {
      type: DataTypes.STRING,
      field: 'url'
    },
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
    duration: {
      type: DataTypes.INTEGER, 
      defaultValue: 0,
      field: 'duration'
    },
    activity_type: {
      type: DataTypes.ENUM('application', 'browser', 'system'),
      defaultValue: 'application',
      field: 'activity_type'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
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
    tableName: 'activities',
    freezeTableName: true,
    underscored: true,
    hooks: {
      beforeCreate: (activity) => {
        activity.created_at = new Date();
        activity.updated_at = new Date();
      },
      beforeUpdate: (activity) => {
        activity.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['app_name']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['startTime', 'endTime']
      }
    ]
  });

  return Activity;
};

export default Activity;
