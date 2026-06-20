const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const User = require("./user");

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    refreshTokenHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    ip: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    userAgent: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "sessions",
    timestamps: true,
  },
);

User.hasMany(Session, {
  foreignKey: "userId",
});

Session.belongsTo(User, {
  foreignKey: "userId",
});

module.exports = Session;
