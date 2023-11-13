import { genForeignKey } from "../../utils/db.js";

const UsersAttributes = (sequelize, DataTypes) => {
    const model = sequelize.define('users_attributes', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        read: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        write: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        update: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        delete: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
    });

    model.associate = (models) => {
        // Создание внешнего ключа из таблицы activations, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id'));
    }

    return model;
};

export default UsersAttributes;