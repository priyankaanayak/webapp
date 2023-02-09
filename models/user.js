'use strict';
module.exports = (sequelize, DataTypes) => {
var User = sequelize.define('User', {
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique:true,
        type: DataTypes.INTEGER,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        allowNull: false,
        type: DataTypes.STRING 
    },
    username: {
        allowNull: false,
        unique:true,
        type: DataTypes.STRING
    },
    account_created: {
        allowNull: false,
        unique:true,
        type: DataTypes.STRING
    },
    account_updated: {
        allowNull: false,
        unique:true,
        type: DataTypes.STRING
    }
},{
    timestamps: false,
    freezeTableName: true,
    modelName: 'singularName'
}
);

User.associate = function(models) {

    console.log(models);
    models.User.hasMany(models.Product,{foreignKey:{
        name: 'owner_user_id',
        allowNull: false
    }, sourceKey:'id'});
  };

return User;
}

