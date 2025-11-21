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

// Initialize models
const User = userModel(sequelize, Sequelize.DataTypes);
const Activity = activityModel(sequelize, Sequelize.DataTypes);
const Screenshot = screenshotModel(sequelize, Sequelize.DataTypes);
const Keystroke = keystrokeModel(sequelize, Sequelize.DataTypes);
const SystemMetric = systemMetricModel(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Activity, { foreignKey: 'userId' });
User.hasMany(Screenshot, { foreignKey: 'userId' });
User.hasMany(Keystroke, { foreignKey: 'userId' });
User.hasMany(SystemMetric, { foreignKey: 'userId' });

Activity.belongsTo(User, { foreignKey: 'userId' });
Screenshot.belongsTo(User, { foreignKey: 'userId' });
Keystroke.belongsTo(User, { foreignKey: 'userId' });
SystemMetric.belongsTo(User, { foreignKey: 'userId' });

// Add models to db object
db.User = User;
db.Activity = Activity;
db.Screenshot = Screenshot;
db.Keystroke = Keystroke;
db.SystemMetric = SystemMetric;
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
  sequelize,
  Sequelize
};
