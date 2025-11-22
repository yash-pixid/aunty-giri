const Recommendation = (sequelize, DataTypes) => {
  const Recommendation = sequelize.define('Recommendation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content_type: {
      type: DataTypes.ENUM('video', 'article', 'course'),
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    category: {
      type: DataTypes.ENUM('programming', 'ai_ml', 'data_science', 'digital_marketing', 'science', 'career', 'technology', 'entrepreneurship'),
      allowNull: false
    },
    student_standard: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    difficulty_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner'
    },
    source: {
      type: DataTypes.STRING(100),
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
    tableName: 'recommendations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['student_standard']
      },
      {
        fields: ['category']
      },
      {
        fields: ['student_standard', 'category']
      }
    ]
  });

  return Recommendation;
};

export default Recommendation;