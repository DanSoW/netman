import { genForeignKey } from "../../utils/db.js";

const TestMarks = (sequelize, DataTypes) => {
    const model = sequelize.define('test_marks', {
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
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(1024),
            allowNull: false
        },
        ref_img: {
            type: DataTypes.STRING(512),
            allowNull: true
        }
    });

    model.associate = (models) => {
        // Создание внешнего ключа из таблицы test_marks, на таблицу users
        model.belongsTo(models.Users, genForeignKey('users_id'));
    }

    return model;
};

export default TestMarks;