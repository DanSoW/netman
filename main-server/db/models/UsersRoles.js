import { genForeignKey } from "../../utils/db.js";

const UsersRoles = (sequelize, DataTypes) => {
    const model = sequelize.define('users_roles', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        name_role: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });

    model.associate = (models) => {
        // Создание внешнего ключа из таблицы users_roles, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id'));

        // Создание внешнего ключа из таблицы users_roles, на таблицу users_groups
        model.belongsTo(models.UsersGroups, genForeignKey('users_groups_id'));
    };

    return model;
};

export default UsersRoles;