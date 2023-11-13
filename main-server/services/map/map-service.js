import dotenv from 'dotenv';
dotenv.config({ path: `.${process.env.NODE_ENV}.env` });
import ApiError from '../../exceptions/api-error.js';
import db from '../../db/index.js';

/* Сервис управления картами */
class MapService {
    /**
     * Создание новой метки
     * @param {*} data Информация для создания метки
     * @returns Созданная метка
     */
    async markCreate(data) {
        const t = await db.sequelize.transaction();

        try {
            const { lat, lng, location, users_id } = data;
            const user = await db.Users.findOne({ where: { id: users_id } });

            if (!user) {
                throw ApiError.BadRequest("Попытка удаления заданий неавторизованным пользователем");
            }

            const modules = await db.UsersModules.findOne({ where: { users_id: users_id } });

            // Добавление меток осуществляет только администратор или супер-администратор
            if ((modules.dataValues.admin === false)
                && (modules.dataValues.super_admin === false)
            ) {
                throw ApiError.Forbidden("Нет доступа");
            }

            await db.Marks.create({
                lat: lat,
                lng: lng,
                location: location,
                users_id: users_id
            }, { transaction: t });

            await t.commit();
            
            return data;
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Получение списка меток
     * @param {*} data Данные пользователя
     * @returns Список меток
     */
    async marks(data) {
        try {
            const { users_id } = data;
            const user = await db.Users.findOne({ where: { id: users_id } });

            if (!user) {
                throw ApiError.BadRequest("Попытка удаления заданий неавторизованным пользователем");
            }

            const values = await db.Marks.findAll();

            return values;
        } catch (e) {
            console.log(e);
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Получение свободных меток
     * @param {*} data Информация о пользователе
     * @returns Список свободных меток
     */
    async marksFree(data) {
        try {
            const { users_id } = data;
            const user = await db.Users.findOne({ where: { id: users_id } });

            if (!user) {
                throw ApiError.BadRequest("Попытка удаления заданий неавторизованным пользователем");
            }

            const allGames = await db.InfoGames.findAll({
                where: {
                    date_end: {
                        [db.Sequelize.Op.gt]: new Date()
                    }
                },
                include: {
                    model: db.GamesQuests
                }
            });

            const busyMarks = [];
            for (let i = 0; i < allGames.length; i++) {
                let dataQuests = await db.Quests.findAll({
                    where: {
                        id: {
                            [db.Sequelize.Op.in]: allGames[i].dataValues.games_quests.map(item => {
                                return item.dataValues.quests_id;
                            })
                        }
                    }
                });

                for (let j = 0; j < dataQuests.length; j++) {
                    busyMarks.push(dataQuests[j].dataValues.marks_id);
                }
            }

            const freeMarks = await db.Marks.findAll({
                where: {
                    id: {
                        [db.Sequelize.Op.notIn]: busyMarks
                    }
                }
            });

            return freeMarks;
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }
}

export default new MapService();