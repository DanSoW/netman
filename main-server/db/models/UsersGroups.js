import { genForeignKey } from "../../utils/db.js";

const UsersGroups = (sequelize, DataTypes) => {
    const model = sequelize.define('users_groups', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        name: {
            type: DataTypes.TEXT,
            unique: true,
            allowNull: false
        },
        date_create: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    model.associate = (models) => {
        // Создание внешнего ключа из таблицы activations, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id'));

        // Создание отношения один (users_groups) ко многим (users_roles)
        model.hasMany(models.UsersRoles, genForeignKey('users_groups_id', true));

        // Создание отношения один (users_groups) ко многим (group_modules)
        model.hasMany(models.GroupsModules, genForeignKey('users_groups_id'));

        // Создание отношения один (users_groups) ко многим (groups_attributes)
        model.hasMany(models.GroupsAttributes, genForeignKey('users_groups_id'));

    };

    return model;
};

export default UsersGroups;