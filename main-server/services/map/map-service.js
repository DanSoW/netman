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

            // Поиск прав доступа для создания метки
            const userRoles = await db.UsersRoles.findAll({
                where: {
                    users_id: users_id
                },
                include: {
                    model: db.Roles,
                    where: {
                        priority: { [db.Sequelize.Op.gt]: 1 }
                    },
                },
            });

            if (userRoles.length === 0) {
                throw ApiError.Forbidden("Нет доступа");
            }

            const mark = await db.Marks.findOne({
                where: {
                    lat: lat,
                    lng: lng
                }
            });

            if (mark) {
                throw ApiError.BadRequest("Метка по данным координатам уже существует!");
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

            const freeMarks = await db.Marks.findAll();

            return freeMarks;
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }
}

export default new MapService();