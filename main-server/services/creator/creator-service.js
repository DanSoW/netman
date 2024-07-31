import dotenv from 'dotenv';
dotenv.config({ path: `.${process.env.NODE_ENV}.env` });
import config from 'config';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from '../../db/index.js';
import ApiError from '../../exceptions/api-error.js';
import SuccessDto from '../../dtos/response/success-dto.js';
import FlagDto from '../../dtos/response/flag-dto.js';
import tokenService from '../token/token-service.js';
import securityService from '../security/security-service.js';
import NameModules from '../../constants/values/name-modules.js';
import fs from 'fs';

/* Сервис системы безопасности */
class CreatorService {
    /**
     * Создание новой игры
     * @param {*} data Данные для создания новой игры
     * @returns Данные созданной игры
     */
    async gameCreate(data) {
        const t = await db.sequelize.transaction();

        try {
            const { location, title, quests, users_id } = data;

            // Поиск прав доступа для создания игры
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

            const exists = await db.InfoGames.findOne({
                where: {
                    title: title.trim()
                }
            });

            if(exists) {
                throw ApiError.BadRequest("Игра с таким названием уже существует!");
            }

            // Создание новой игры
            const infoGame = await db.InfoGames.create({
                users_id: users_id,
                title: title,
                location: location
            }, { transaction: t });

            // Добавление новых квестов
            for (let i = 0; i < quests.length; i++) {
                // Создание нового квеста
                const quest = await db.Quests.create({
                    task: quests[i].task,
                    hint: quests[i].hint,
                    radius: quests[i].radius,
                    action: quests[i].action,
                    marks_id: quests[i].marks_id,
                }, { transaction: t });

                // Создание связки игры с квестом
                await db.GamesQuests.create({
                    quests_id: quest.dataValues.id,
                    info_games_id: infoGame.dataValues.id
                }, { transaction: t });
            }

            await t.commit();

            return data;
        } catch (e) {
            console.log(e);
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Получение информации обо всех играх, которые были созданны текущим пользователем
     * @param {*} data Информация о пользователе
     * @returns Информация обо всех играх, созданных данным пользователем
     */
    async gamesCreated(data) {
        try {
            const { users_id } = data;

            const user = await db.Users.findOne({ where: { id: users_id } });

            if (!user) {
                throw ApiError.BadRequest("Пользователя с данным идентификатором не существует");
            }

            const modules = await db.UsersModules.findOne({ where: { users_id: users_id } });

            if ((!modules) || (modules.creator === false)) {
                throw ApiError.Forbidden("Нет доступа");
            }

            // Получение информации обо всех играх, которые были созданы текущим пользователем
            const games = await db.InfoGames.findAll({ where: { users_id: users_id } });

            /*games.removeIf(function (item, idx) {
                return ((new Date(item.dataValues.date_end)) < (new Date()));
            });*/

            const gamesCreated = [];
            for (let i = 0; i < games.length; i++) {
                // Получение информации об очереди игры на проверку
                const index = await db.QueueGames.findOne({ where: { info_games_id: games[i].dataValues.id } });

                // Получение всех квестов, которые связаны с данной игрой
                const quests = await db.GamesQuests.findAll({ where: { info_games_id: games[i].dataValues.id } });

                // Установка параметра "количество квестов"
                games[i].dataValues.count_points = quests.length;

                // Если игра ещё находится в очереди на проверку (т.е. не запущена)
                if (index) {
                    // То обнуляем данные о предупреждениях, банах и accepted устанавливаем в false
                    games[i].dataValues.warnings = [];
                    games[i].dataValues.bans = [];
                    games[i].dataValues.accepted = false;
                } else {
                    // Иначе, игра уже запущена и нужно получить информацию о состоянии проверки
                    // Получаем состояние проверки
                    const checkedGame = await db.CheckedGames.findOne({ where: { info_games_id: games[i].dataValues.id } });

                    // Если состояние проверки есть, то добавляем информации об игре предупреждения, баны и флаг accepted
                    if (checkedGame) {
                        const warnings = await Warnings.findAll({ where: { checked_games_id: checkedGame.id } });
                        const bans = await Bans.findAll({ where: { checked_games_id: checkedGame.id } });
                        games[i].dataValues.warnings = warnings;
                        games[i].dataValues.bans = bans;
                        games[i].dataValues.accepted = checkedGame.dataValues.accepted;

                    }
                }

                gamesCreated.push(games[i].dataValues);
            }

            return gamesCreated;
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Удаление информации об игре
     * @param {*} data Данные для удаления игры
     * @returns Данные удалённой игры
     */
    async gameDelete(data) {
        const t = await db.sequelize.transaction();

        try {

            const { users_id, info_games_id } = data;

            const user = await db.Users.findOne({ where: { id: users_id } });

            if (!user) {
                throw ApiError.BadRequest("Попытка удаления заданий неавторизованным пользователем");
            }

            // Проверка доступа
            const modules = await db.UsersModules.findOne({ where: { users_id: users_id } });

            if ((!modules) || (modules.creator === false)) {
                throw ApiError.Forbidden("Нет доступа");
            }

            const infoGames = await db.InfoGames.findOne({
                where: {
                    id: info_games_id,
                    users_id: users_id
                }
            });

            if (!infoGames) {
                throw ApiError.NotFound("Данная игра не присутствует в базе данных");
            }

            // Поиск непроверенной игры
            const checkedGames = await db.CheckedGames.findOne({
                where: {
                    info_games_id: infoGames.id
                }
            });

            if (checkedGames && checkedGames.accepted) {
                throw ApiError.BadRequest("Нельзя удалить игры, которые были одобрены модератором");
            }

            const queueGames = await db.QueueGames.findOne({
                where: {
                    info_games_id: info_games_id
                }
            });

            if (!queueGames) {
                throw ApiError.NotFound("Информация об очереди игры не найдена");
            }

            // Удаление игры из очереди, если она находится в очереди
            if (queueGames) {
                await queueGames.destroy({ transaction: t });
            }

            // Удаление игры из очереди, если она проверена модератором но не одобрена
            if (checkedGames && (!checkedGames.accepted)) {
                // Удаление предупреждений
                await db.Warnings.destroy({
                    where: {
                        checked_games_id: checkedGames.id
                    }
                }, { transaction: t });

                // Удаление блокировок
                await db.Bans.destroy({
                    where: {
                        checked_games_id: checkedGames.id
                    }
                }, { transaction: t });

                // Удаление состояния проверки игры
                await checkedGames.destroy({ transaction: t });
            }

            // Удаление информации обо всех квестах, привязанных к данной игре
            const questsGames = await db.GamesQuests.findAll({
                where: {
                    info_games_id: infoGames.id
                }
            });

            for (let i = 0; i < questsGames.length; i++) {
                const quest = await db.Quests.findOne({
                    where: {
                        id: questsGames[i].quests_id
                    }
                });

                if (quest) {
                    // Удаление соответствия квестов определённой игре
                    await db.GamesQuests.destroy({
                        where: {
                            info_games_id: questsGames[i].info_games_id,
                            quests_id: quest.id
                        }
                    }, { transaction: t });

                    // Удаление информации об определённом квесте
                    await quest.destroy({ transaction: t });
                }
            }

            // Удаление информации о определённой игре
            await infoGames.destroy({ transaction: t });

            await t.commit();

            return data;
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Создание новой метки
     * @param {*} data Данные для создания новой метки
     * @returns Данные созданной метки
     */
    async markAddInfo(data) {
        const t = await db.sequelize.transaction();

        try {

            const { users_id, title, description, lat, lng } = data;

            // Создание новой метки
            const mark = await db.TestMarks.create({
                users_id: users_id,
                title: title,
                description: description,
                lat: lat,
                lng: lng
            }, { transaction: t });

            await t.commit();

            return {
                title, description, lat, lng,
                test_marks_id: mark.id
            };
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Добавление изображения к метке
     * @param {*} filedata Путь к загруженному файлу
     * @param {*} data Данные для добавления изображения к метке
     * @returns Ссылка на загруженное изображение
     */
    async markAddImg(filedata, data) {
        const t = await db.sequelize.transaction();

        try {
            const { users_id, test_marks_id } = data;
            const mark = await db.TestMarks.findOne({
                where: {
                    id: test_marks_id,
                    users_id: users_id
                }
            });

            if (!mark) {
                fs.unlinkSync(filedata.path);
                throw ApiError.NotFound("Данной метки не существует");
            }

            if (mark.ref_img) {
                // Удаление старого изображения
                fs.unlinkSync(mark.ref_img);
            }

            await db.TestMarks.update({ ref_img: filedata.path }, { where: { id: test_marks_id }, transaction: t });

            await t.commit();

            return {
                test_marks_id,
                ref_img: `${config.get("url.api")}/${filedata.path}`
            };
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Удаление информации о метке
     * @param {*} data Данные для удаления метки
     * @returns Данные удалённой метки
     */
    async markDeleteInfo(data) {
        const t = await db.sequelize.transaction();

        try {
            const { users_id, test_marks_id } = data;
            const mark = await db.TestMarks.findOne({
                where: {
                    id: test_marks_id,
                    users_id: users_id
                }
            });

            if (!mark) {
                throw ApiError.NotFound("Данной метки не существует");
            }

            const filepath = mark.ref_img;
            // Удаление информации о метке

            await mark.destroy({ transaction: t });

            if (filepath) {
                // Удаление изображения
                fs.unlinkSync(filepath);
            }

            await t.commit();

            return {
                test_marks_id
            };
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Удаление изображения метки
     * @param {*} data Данные для удаления изображения метки
     * @returns Данные метки
     */
    async markDeleteImg(data) {
        const t = await db.sequelize.transaction();

        try {
            const { users_id, test_marks_id } = data;
            const mark = await db.TestMarks.findOne({
                where: {
                    id: test_marks_id,
                    users_id: users_id
                }
            });

            if (!mark) {
                throw ApiError.NotFound("Данной метки не существует");
            }

            const filepath = mark.ref_img;
            if (filepath) {
                // Удаление изображения
                fs.unlinkSync(filepath);
            }

            mark.ref_img = null;
            await mark.save({ transaction: t });

            await t.commit();

            return {
                test_marks_id
            };
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }
}

export default new CreatorService();