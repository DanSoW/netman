import TableName from "../../constants/table/table-name.js";
import { genForeignKey } from "../../utils/db.js";

/**
 * Сборка модели для взаимодействия с таблицей ExecQuests (закрепление за игроком конкретного квеста)
 * @param {*} sequelize Экземпляр ORM Sequelize
 * @param {*} DataTypes Типы данных
 * @returns Собранная модель для взаимодействия с таблицей ExecQuests
 */
const ExecQuests = (sequelize, DataTypes) => {
    const model = sequelize.define(TableName.ExecQuests, {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });

    model.associate = (models) => {
        // Создание внешнего ключа из таблицы exec_quests, на таблицу users_games
        model.belongsTo(models.UsersGames, genForeignKey('users_games_id'));

        // Создание внешнего ключа из таблицы exec_quests, на таблицу quests
        model.belongsTo(models.Quests, genForeignKey('quests_id'));
    };

    return model;
};

export default ExecQuests;