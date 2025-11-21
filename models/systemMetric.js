const SystemMetric = (sequelize, DataTypes) => {
  const SystemMetric = sequelize.define('SystemMetric', {
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
    cpu_usage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'cpu_usage',
      defaultValue: 0
    },
    memory_usage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'memory_usage',
      defaultValue: 0
    },
    disk_usage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'disk_usage',
      defaultValue: 0
    },
    network_in: {
      type: DataTypes.FLOAT,
      field: 'network_in',
      defaultValue: 0
    },
    network_out: {
      type: DataTypes.FLOAT,
      field: 'network_out',
      defaultValue: 0
    },
    cpu_temperature: {
      type: DataTypes.FLOAT,
      field: 'cpu_temperature',
      allowNull: true
    },
    disk_read: {
      type: DataTypes.FLOAT,
      field: 'disk_read',
      defaultValue: 0
    },
    disk_write: {
      type: DataTypes.FLOAT,
      field: 'disk_write',
      defaultValue: 0
    },
    timestamp: {
      type: DataTypes.DATE,
      field: 'timestamp',
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    metrics: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    timestamps: false,
    tableName: 'system_metrics',
    freezeTableName: true,
    underscored: true,
    hooks: {
      beforeCreate: (metric) => {
        metric.created_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return SystemMetric;
};

export default SystemMetric;
