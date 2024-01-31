import { genForeignKey } from "../../utils/db.js";

const DataUsers = (sequelize, DataTypes) => {
    const model = sequelize.define('data_users', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        surname: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        nickname: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        ref_image: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        phone_num: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        date_birthday: {
            type: DataTypes.DATE,
            allowNull: false
        },
        location: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        date_register: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    model.associate = (models) => {
        // Создание внешнего ключа из таблицы activations, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id'));
    };

    return model;
};

export default DataUsers;