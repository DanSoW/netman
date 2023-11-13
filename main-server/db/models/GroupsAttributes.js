import { genForeignKey } from "../../utils/db.js";

const GroupsAttributes = (sequelize, DataTypes) => {
    const model = sequelize.define('groups_attributes', {
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
        // Создание внешнего ключа из таблицы groups_attributes, на таблицу users_groups
        model.belongsTo(models.UsersGroups, genForeignKey('users_groups_id'));
    };

    return model;
};

export default GroupsAttributes;