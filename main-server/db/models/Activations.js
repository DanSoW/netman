// Импорт функции для генерации настроек внешнего ключа
import { genForeignKey } from "../../utils/db.js";

// Модель Activations
const Activations = (sequelize, DataTypes) => {
    // Определение модели
    const model = sequelize.define('activations', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        is_activated: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        activation_link: {
            type: DataTypes.TEXT,
            allowNull: false,
        }
    });

    // Создание метода для настройки связей между таблицами
    model.associate = (models) => {
        // Создание внешнего ключа из таблицы activations, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id'));
    };

    return model;
};

export default Activations;