import { genForeignKey } from "../../utils/db.js";

const GroupsModules = (sequelize, DataTypes) => {
    const model = sequelize.define('groups_modules', {
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
        // Создание внешнего ключа из таблицы groups_modules на таблицу users_groups
        model.belongsTo(models.UsersGroups, genForeignKey('users_groups_id'));
    };

    return model;
};

export default GroupsModules;