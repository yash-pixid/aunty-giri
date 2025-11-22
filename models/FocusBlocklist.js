const FocusBlocklist = (sequelize, DataTypes) => {
  const FocusBlocklist = sequelize.define('FocusBlocklist', {
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
    item_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'item_type'
    },
    item_value: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'item_value'
    },
    is_global: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_global'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'focus_blocklist',
    freezeTableName: true,
    underscored: true,
    hooks: {
      beforeCreate: (item) => {
        item.created_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['user_id']
      },
      {
        unique: true,
        fields: ['user_id', 'item_type', 'item_value']
      }
    ]
  });

  return FocusBlocklist;
};

export default FocusBlocklist;
