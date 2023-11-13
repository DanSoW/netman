import { genForeignKey } from "../../utils/db.js";

const UsersModules = (sequelize, DataTypes) => {
    const model = sequelize.define('users_modules', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        player: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        judge: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        creator: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        moderator: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        manager: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        admin: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        super_admin: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
    });

    model.associate = (models) => {
        // Создание внешнего ключа из таблицы activations, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id'));
    };

    return model;
};

export default UsersModules;