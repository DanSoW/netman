import { genForeignKey } from "../../utils/db.js";

const Quests = (sequelize, DataTypes) => {
    const model = sequelize.define('quests', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        task: {
            type: DataTypes.STRING(1024),
            allowNull: false
        },
        hint: {
            type: DataTypes.STRING(512),
            allowNull: false
        },
        ref_media: {
            type: DataTypes.STRING,
            allowNull: false
        },
        radius: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });

    model.associate = (models) => {
        // Создание отношений один (quests) ко многим (games)
        model.hasMany(models.Games, genForeignKey('quests_id'));

        // Создание внешнего ключа из таблицы marks, на таблицу users
        model.belongsTo(models.Marks, genForeignKey('marks_id'));

        // Создание отношений один (quests) ко многим (games_quests)
        model.hasMany(models.GamesQuests, genForeignKey('quests_id'));
    };

    return model;
};

export default Quests;