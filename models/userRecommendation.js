const UserRecommendation = (sequelize, DataTypes) => {
  const UserRecommendation = sequelize.define('UserRecommendation', {
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
    recommendation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'recommendation_id',
      references: {
        model: 'recommendations',
        key: 'id'
      }
    },
    interaction_type: {
      type: DataTypes.ENUM('viewed', 'clicked', 'liked', 'saved', 'completed', 'dismissed'),
      allowNull: false,
      field: 'interaction_type'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'rating',
      validate: {
        min: 1,
        max: 5
      }
    },
    time_spent_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'time_spent_minutes',
      validate: {
        min: 0
      }
    },
    completion_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'completion_percentage',
      validate: {
        min: 0,
        max: 100
      }
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'feedback'
    },
    recommended_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'recommended_at',
      defaultValue: DataTypes.NOW
    },
    interacted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'interacted_at'
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
    tableName: 'user_recommendations',
    freezeTableName: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['recommendation_id']
      },
      {
        fields: ['interaction_type']
      },
      {
        fields: ['recommended_at']
      },
      {
        unique: true,
        fields: ['user_id', 'recommendation_id', 'interaction_type']
      }
    ],
    hooks: {
      beforeCreate: (userRec) => {
        userRec.created_at = new Date();
        userRec.updated_at = new Date();
      },
      beforeUpdate: (userRec) => {
        userRec.updated_at = new Date();
        if (userRec.changed('interaction_type') && !userRec.interacted_at) {
          userRec.interacted_at = new Date();
        }
      }
    }
  });

  return UserRecommendation;
};

export default UserRecommendation;
