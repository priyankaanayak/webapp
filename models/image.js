'use strict';
//const uuid = require('uuid/v4');

const uuidv4 = require('uuid');
module.exports = (sequelize, DataTypes) => {
var Image = sequelize.define('Image', {
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique : true,
        noUpdate : true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    s3_bucket_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date_created: {
        type: DataTypes.DATE,
    },
},
    {
        timestamps: false,
        
    });

    return Image;
    
}
