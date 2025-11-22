const TrendingTopic = (sequelize, DataTypes) => {
  const TrendingTopic = sequelize.define('TrendingTopic', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    topic_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('programming', 'ai_ml', 'data_science', 'digital_marketing', 'science', 'career', 'technology', 'entrepreneurship'),
      allowNull: false
    },
    student_standard: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 9,
        max: 12
      }
    },
    job_market_demand: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'very_high'),
      allowNull: true,
      defaultValue: 'medium'
    },
    salary_range: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    trending_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
      validate: {
        min: 0,
        max: 100
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'trending_topics',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['student_standard']
      },
      {
        fields: ['category']
      }
    ]
  });

  return TrendingTopic;
};

export default TrendingTopic;