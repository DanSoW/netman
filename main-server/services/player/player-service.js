import dotenv from 'dotenv';
dotenv.config({ path: `.${process.env.NODE_ENV}.env` });
import config from 'config';
import ApiError from '../../exceptions/api-error.js';
import db from '../../db/index.js';
import "../../utils/array.js";
import fs from 'fs';
import GameStatus from '../../constants/status/game-status.js';
import { v4 } from 'uuid';


/* Сервис управления картами */
class PlayerService {
    /**
     * Получение статуса пользователя в игре
     * @param {*} data Информация о пользователе
     * @returns Статус пользователя в игре
     */
    async gameStatus(data) {
        try {
            const { users_id } = data;

            const fixedJudges = await db.FixJudges.findOne({
                where: {
                    users_id: users_id
                }
            });

            if (fixedJudges) {
                return {
                    judge: true,
                    player: false
                };
            }

            const dataPlayers = await db.DataPlayers.findOne({
                where: {
                    users_id: users_id
                }
            });

            if (!dataPlayers) {
                throw ApiError.NotFound("Информации о данном пользователе нет");
            }

            if (!dataPlayers.commands_id) {
                throw ApiError.BadRequest("Данный игрок не имеет команды");
            }

            const commands = await db.Commands.findOne({
                where: {
                    id: dataPlayers.commands_id
                }
            });

            const currentGames = await db.CurrentGames.findOne({
                where: {
                    commands_id: commands.id,
                }
            });

            if (!currentGames) {
                throw ApiError.BadRequest("У данного игрока нет текущей игры");
            }

            return {
                player: true,
                judge: false
            }
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Получение всех доступных игр
     * @param {*} data Информация о пользователе
     * @returns Список доступных игр
     */
    async games(data) {
        try {
            const { users_id } = data;

            const currentDate = new Date();
            const infoGames = await db.InfoGames.findAll({
                where: {
                    date_end: {
                        [db.Sequelize.Op.gt]: currentDate
                    }
                }
            });

            for (let i = 0; i < infoGames.length; i++) {
                // Определение числа команд, которые уже зарегистрированы на данную игру
                const countRegister = await db.RegisterCommands.count({ where: { info_games_id: infoGames[i].id } });
                infoGames[i].dataValues.count_register_commands = countRegister;

                // Определение никнеймов создателей игр
                const findingData = await db.DataUsers.findOne({ where: { users_id: infoGames[i].users_id } });
                infoGames[i].dataValues.nickname_creator = findingData.nickname;
            }

            return infoGames;
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Получение информации о пользователе
     * @param {*} data Идентификатор пользователя
     * @returns Информация о пользователе
     */
    async playerInfo(data) {
        try {
            const { users_id, context_user_data } = data;

            const dataUser = await db.DataUsers.findOne({ where: { users_id: users_id } });
            dataUser.dataValues.data_players = (await db.DataPlayers.findOne({
                where: {
                    users_id: users_id
                }
            }));

            dataUser.dataValues.email = context_user_data.email;

            return {
                ...dataUser.dataValues
            };
        } catch (e) {
            console.log(e);
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Обновление информации о пользователе
     * @param {*} data Информация о пользователе
     * @returns Информация о пользователе
     */
    async playerInfoUpdate(data) {
        const t = await db.sequelize.transaction();

        try {
            const { users_id, nickname, email } = data;
            const user = await db.Users.findOne({
                where: {
                    id: users_id
                }
            });

            if (!user) {
                throw ApiError.NotFound("Пользователя с данным идентификатором не найдено");
            }

            const userData = await db.DataUsers.findOne({
                where: {
                    users_id: users_id
                }
            });

            if (!userData) {
                throw ApiError.NotFound("Данных у пользователя не существует!");
            }

            const userEmail = await db.Users.findOne({
                where: {
                    email: email
                }
            });

            if (userEmail && (userEmail.id !== user.id)) {
                throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`);
            }

            if (email !== user.email) {
                user.email = email;
            }

            const userNickname = await db.DataUsers.findOne({ where: { nickname: nickname } });
            if (userNickname && (userNickname.users_id !== user.id)) {
                throw ApiError.BadRequest(`Пользователь с никнеймом ${nickname} уже существует`);
            }

            if (nickname !== userData.nickname) {
                userData.nickname = nickname;
            }

            await user.update({ transaction: t });
            await userData.update({ transaction: t });

            await t.commit();

            return {
                users_id: users_id,
                nickname: nickname,
                email: email
            }
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    async playerInfoImgUpdate(filedata, data) {
        const t = await db.sequelize.transaction();

        try {
            const { users_id } = data;
            const dataUser = await db.DataUsers.findOne({
                where: {
                    users_id: users_id,
                }
            });

            if ((dataUser) && (dataUser.ref_image) && (dataUser.ref_image.length > 0)) {
                if (fs.existsSync(dataUser.ref_image)) {
                    // Удаление старого изображения
                    fs.unlinkSync(dataUser.ref_image);
                }
            }

            await db.DataUsers.update({ ref_image: filedata.path }, { where: { users_id: users_id }, transaction: t });

            await t.commit();

            return {
                url: `${config.get("url.api")}/${filedata.path}`
            };
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    async playerInfoImg(data) {
        try {
            const { users_id } = data;
            const dataUser = await db.DataUsers.findOne({
                where: {
                    users_id: users_id,
                }
            });

            if ((dataUser) && (dataUser.ref_image) && (dataUser.ref_image.length > 0)) {
                if (fs.existsSync(dataUser.ref_image)) {
                    return {
                        url: `${config.get("url.api")}/${dataUser.ref_image}`
                    };
                }
            }

            return {
                url: ''
            };
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Получение статистики пользователя
     * @param {*} data Информация о пользователе
     * @returns Статистика пользователя
     */
    async playerStatistics(data) {
        try {
            const { users_id } = data;
            const dataPlayer = await db.DataPlayers.findOne({ where: { users_id: users_id } });
            let ratingCommand = 0;

            if (dataPlayer.commands_id) {
                const dataCommand = await db.Commands.findOne({ where: { id: dataPlayer.commands_id } });
                ratingCommand = dataCommand.rating;
            }

            const result = {
                rating_player: dataPlayer.rating,
                rating_command: ratingCommand
            };

            return result;
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Получение списка определенных пользователей по тэгу
     * @param {*} data Тэг поиска
     * @returns Результат поиска
     */
    async playerFindCertain(data) {
        try {
            const { users_id, tag } = data;

            // Список всех свободных пользователей
            const freeAllPlayers = await db.DataPlayers.findAll({
                where: {
                    users_id: {
                        [db.Sequelize.Op.ne]: users_id
                    }
                }
            });

            const freePlayers = [];

            for (let i = 0; i < freeAllPlayers.length; i++) {
                const dplayer = await db.DataUsers.findOne({
                    where: {
                        users_id: freeAllPlayers[i].users_id,
                    }
                });

                if ((dplayer) && (
                    (dplayer.name.includes(tag))
                    || (dplayer.surname.includes(tag))
                    || (dplayer.nickname.includes(tag))
                )) {
                    freeAllPlayers[i].dataValues.data_player = undefined;
                    freeAllPlayers[i].dataValues.commands_id = undefined;
                    freePlayers.push(Object.assign(freeAllPlayers[i].dataValues, dplayer.dataValues))
                }
            }

            return freePlayers;
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Присоединение игрока к конкретной игре
     * @param {*} data Данные запроса
     * @returns Результат связывания игрока с конкретной игрой
     */
    async playerJoinGame(data) {
        const t = await db.sequelize.transaction();

        try {
            const { users_id, info_games_id } = data;

            const usersGames = await db.UsersGames.findAll({
                where: {
                    users_id: users_id,
                    status: GameStatus.ACTIVE
                }
            });

            if (usersGames && usersGames.length > 0) {
                throw ApiError.BadRequest("Одновременно нельзя зарегистрироваться на несколько игр");
            }

            const infoGame = await db.InfoGames.findOne({
                where: {
                    id: info_games_id
                }
            });

            if (!infoGame) {
                throw ApiError.BadRequest("Данной игры не существует");
            }

            // Идентификатор сессии
            const sessionId = v4();

            // Создание связи между пользователем и игрой
            const createUserGame = await db.UsersGames.create({
                users_id: users_id,
                info_games_id: info_games_id,
                session_id: sessionId,
                status: GameStatus.ACTIVE
            }, { transaction: t });

            // Определение игровых квестов
            const quests = await db.GamesQuests.findAll({
                where: {
                    info_games_id: info_games_id
                }
            });

            let quest = null;

            if (quests.length > 0) {
                quest = await db.Quests.findOne({
                    where: {
                        id: quests[0].quests_id
                    }
                });

                // Определение текущего квеста для игрока
                const createExecQuest = await db.ExecQuests.create({
                    users_games_id: createUserGame.id,
                    quests_id: quest.id,
                    status: GameStatus.ACTIVE
                }, { transaction: t });
            } else {
                throw ApiError.BadRequest("У текущей игры отсутствуют квесты");
            }


            await t.commit();

            return {
                game: infoGame.dataValues,
                quest: quest.dataValues
            };
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Получение информации об игре
     * @param {*} data Данные запроса
     * @returns Результат выполнения запроса
     */
    async playerGameInfo(data) {
        try {
            const { users_id } = data;

            const userGame = await db.UsersGames.findOne({
                where: {
                    users_id: users_id,
                    status: GameStatus.ACTIVE
                }
            });

            if (!userGame) {
                // Обработка ситуации, когда у пользователя нет текущей игры
                return {
                    joined_game: false
                };
            }

            const game = await db.InfoGames.findOne({
                where: {
                    id: userGame.info_games_id
                }
            });

            if (!game) {
                return {
                    joined_game: false
                };
            }

            const execQuests = await db.ExecQuests.findOne({
                where: {
                    users_games_id: userGame.id,
                    status: GameStatus.ACTIVE
                }
            });

            if (!execQuests) {
                return {
                    joined_game: false
                };
            }

            // Формирование информации о всех квестах текущей игры
            const quest = await db.Quests.findOne({
                where: {
                    id: execQuests.quests_id
                }
            });

            /*const quests = [];
            for(let i = 0; i < execQuests.length; i++) {
                const item = execQuests[i];

                const quest = await db.Quests.findOne({
                    where: {
                        id: item.quests_id,
                    }
                });

                if(quest) {
                    const questInfo = {
                        ...quest.dataValues,
                        status: item.status
                    };

                    quests.push(questInfo);
                }
            }*/

            const result = {
                ...game.dataValues,
                session_id: userGame.session_id,
                quest: quest.dataValues,
                joined_game: true
            };

            return result;
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Выход пользователя из игры
     * @param {*} data Данные запроса
     * @returns Результат выполнения запроса
     */
    async playerDetachGame(data) {
        const t = await db.sequelize.transaction();

        try {
            const { users_id, session_id } = data;

            const userGame = await db.UsersGames.findOne({
                where: {
                    users_id: users_id,
                    session_id: session_id
                }
            });

            if (!userGame) {
                throw ApiError.BadRequest(`Игровой сессии с идентификатором "${session_id}" не найдено`);
            }

            const execQuests = await db.ExecQuests.findAll({
                where: {
                    users_games_id: userGame.id
                }
            });

            // Отвязывание текущей игры и квестов от игрока
            for (let i = 0; i < execQuests.length; i++) {
                await execQuests[i].destroy({ transaction: t });
            }

            await userGame.destroy({ transaction: t });

            await t.commit();

            return {
                completed: true
            };
        } catch (e) {
            await t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }
}

export default new PlayerService();