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
            type: DataTypes.STRING,
            allowNull: false
        },
        surname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nickname: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        ref_image: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone_num: {
            type: DataTypes.STRING(16),
            allowNull: false,
            unique: true
        },
        date_birthday: {
            type: DataTypes.DATE,
            allowNull: false
        },
        location: {
            type: DataTypes.STRING(1024),
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