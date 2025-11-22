import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Sequelize from 'sequelize';
import config from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];
const db = {};

let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

// Import models
import userModel from './user.js';
import activityModel from './activity.js';
import screenshotModel from './screenshot.js';
import keystrokeModel from './keystroke.js';
import systemMetricModel from './systemMetric.js';
import recommendationModel from './recommendation.js';
import trendingTopicModel from './trendingTopic.js';
import userRecommendationModel from './userRecommendation.js';

// Initialize models
const User = userModel(sequelize, Sequelize.DataTypes);
const Activity = activityModel(sequelize, Sequelize.DataTypes);
const Screenshot = screenshotModel(sequelize, Sequelize.DataTypes);
const Keystroke = keystrokeModel(sequelize, Sequelize.DataTypes);
const SystemMetric = systemMetricModel(sequelize, Sequelize.DataTypes);
const Recommendation = recommendationModel(sequelize, Sequelize.DataTypes);
const TrendingTopic = trendingTopicModel(sequelize, Sequelize.DataTypes);
const UserRecommendation = userRecommendationModel(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Activity, { foreignKey: 'userId' });
User.hasMany(Screenshot, { foreignKey: 'userId' });
User.hasMany(Keystroke, { foreignKey: 'userId' });
User.hasMany(SystemMetric, { foreignKey: 'userId' });
User.hasMany(UserRecommendation, { foreignKey: 'user_id' });

// Parent-Student relationship
User.hasMany(User, { foreignKey: 'parent_id', as: 'students' });
User.belongsTo(User, { foreignKey: 'parent_id', as: 'parent' });

Activity.belongsTo(User, { foreignKey: 'userId' });
Screenshot.belongsTo(User, { foreignKey: 'userId' });
Keystroke.belongsTo(User, { foreignKey: 'userId' });
SystemMetric.belongsTo(User, { foreignKey: 'userId' });

// Recommendation associations
Recommendation.hasMany(UserRecommendation, { foreignKey: 'recommendation_id' });
UserRecommendation.belongsTo(User, { foreignKey: 'user_id' });
UserRecommendation.belongsTo(Recommendation, { foreignKey: 'recommendation_id' });

// Add models to db object
db.User = User;
db.Activity = Activity;
db.Screenshot = Screenshot;
db.Keystroke = Keystroke;
db.SystemMetric = SystemMetric;
db.Recommendation = Recommendation;
db.TrendingTopic = TrendingTopic;
db.UserRecommendation = UserRecommendation;
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Export models
export default db;

export {
  User,
  Activity,
  Screenshot,
  Keystroke,
  SystemMetric,
  Recommendation,
  TrendingTopic,
  UserRecommendation,
  sequelize,
  Sequelize
};
