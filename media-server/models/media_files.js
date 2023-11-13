module.exports = function (sequelize, DataTypes) {
    return sequelize.define('media_files', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        name_file: {
            type: DataTypes.STRING(512),
            allowNull: false
        },
        local_path: {
            type: DataTypes.STRING(1024),
            allowNull: false
        },
        type: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        ext: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
    });
};