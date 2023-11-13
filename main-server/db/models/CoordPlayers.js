import { genForeignKey } from "../../utils/db.js";

const CoordPlayers = (sequelize, DataTypes) => {
    const model = sequelize.define('coord_players', {
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
        }
    });

    model.associate = (models) => {
        // Создание внешнего ключа из таблицы activations, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id'));
    };

    return model;
};

export default CoordPlayers;