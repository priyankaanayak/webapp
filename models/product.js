'use strict';
//const uuid = require('uuid/v4');
//const uuidv4 = require('uuid/v4');
//const uuidv4 = require('uuid');
module.exports = (sequelize, DataTypes) => {
var Product = sequelize.define('Product', {
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique:true,
        type: DataTypes.INTEGER
    },
    // created_ts:{
    //     allowNull: false,
    //     type: DataTypes.STRING
    // },
    // updated_ts:{
    //     allowNull: false,
    //     type: DataTypes.STRING
    // },
    name:{
        allowNull: false,
        type: DataTypes.STRING
    },
    description:{
        allowNull: false,
        type: DataTypes.STRING
    },
    sku:{
        allowNull: false,
        type: DataTypes.STRING,
        unique: {
            arg: true,
            msg: "SKU already taken! Give another unique SKU",
    }
        },
    manufacturer: {
        allowNull: false,
        type: DataTypes.STRING
    },
    quantity:{
        allowNull: false,
        type: DataTypes.INTEGER,
        min: 0
    },
    date_added:{
        allowNull: false,
        type: DataTypes.STRING
    },
    date_last_updated:{
        allowNull: false,
        type: DataTypes.STRING
    }
},
    {
        timestamps: false,
        freezeTableName: true,
        modelName: 'singularName'
    });

return Product;
}