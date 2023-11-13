import { genForeignKey } from "../../utils/db.js";

const InfoGames = (sequelize, DataTypes) => {
    const model = sequelize.define('info_games', {
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
        max_count_commands: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date_begin: {
            type: DataTypes.DATE,
            allowNull: false
        },
        date_end: {
            type: DataTypes.DATE,
            allowNull: false
        },
        age_limit: {
            type: DataTypes.SMALLINT,
            allowNull: false
        },
        type: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        rating: {
            type: DataTypes.SMALLINT,
            allowNull: false
        },
        min_score: {
            type: DataTypes.SMALLINT,
            allowNull: false
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });

    model.associate = (models) => {
        // Создание отношений одного (info_games) ко многим (fix_judges)
        model.hasMany(models.FixJudges, genForeignKey('info_games_id'));

        // Создание внешнего ключа из таблицы info_games, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id'));

        // Создание отношений одного (info_games) ко многим (register_games)
        model.hasMany(models.RegisterCommands, genForeignKey('info_games_id'));

        // Создание отношений одного (info_games) ко многим (games_quests)
        model.hasMany(models.GamesQuests, genForeignKey('info_games_id'));

        // Создание отношений одного (info_games) ко многим (current_games)
        model.hasMany(models.CurrentGames, genForeignKey('info_games_id'));

        // Создание отношений одного (info_games) ко многим (complete_games)
        model.hasMany(models.CompleteGames, genForeignKey('info_games_id'));

        // Создание отношений одного (info_games) ко многим (checked_games)
        model.hasMany(models.CheckedGames, genForeignKey('info_games_id'));

        // Создание отношений одного (info_games) ко многим (queue_games)
        model.hasMany(models.QueueGames, genForeignKey('info_games_id'));
    };

    return model;
};

export default InfoGames;