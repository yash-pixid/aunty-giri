import bcrypt from 'bcryptjs';

const User = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'id'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'username',
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'email',
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password',
      validate: {
        notEmpty: true,
        len: [6, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'parent', 'student'),
      allowNull: false,
      defaultValue: 'student',
      field: 'role'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    last_active: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_active'
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
    tableName: 'users',
    freezeTableName: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        user.created_at = new Date();
        user.updated_at = new Date();
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        user.updated_at = new Date();
      }
    }
  });

  // Instance method to check password
  User.prototype.isValidPassword = async function(password) {
    if (!password || !this.password) return false;
    return await bcrypt.compare(password, this.password);
  };

  // Instance method to check if password was changed after JWT was issued
  User.prototype.changedPasswordAfter = function(JWTTimestamp) {
    if (this.updatedAt) {
      const changedTimestamp = Math.floor(this.updatedAt.getTime() / 1000);
      return JWTTimestamp < changedTimestamp;
    }
    // False means NOT changed
    return false;
  };

  return User;
};

export default User;
