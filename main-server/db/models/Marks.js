import { genForeignKey } from "../../utils/db.js";

const Marks = (sequelize, DataTypes) => {
    const model = sequelize.define('marks', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        lat: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        lng: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING(1024),
            allowNull: false
        }
    });

    model.associate = (models) => {
        // Создание внешнего ключа из таблицы marks, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id', true));

        // Создание отношения одного (marks) ко многим (quests)
        model.hasMany(models.Quests, genForeignKey('marks_id'));
    };

    return model;
};

export default Marks;