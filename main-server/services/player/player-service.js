import dotenv from 'dotenv';
dotenv.config({ path: `.${process.env.NODE_ENV}.env` });
import config from 'config';
import ApiError from '../../exceptions/api-error.js';
import db from '../../db/index.js';
import FlagDto from '../../dtos/response/flag-dto.js';
import "../../utils/array.js";
import fs from 'fs';

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
            const { users_id } = data;
            const user = await db.Users.findOne({ where: { id: users_id } });

            if (!user) {
                throw ApiError.NotFound("Пользователя с данным идентификатором не найдено");
            }

            const dataUser = await db.DataUsers.findOne({ where: { users_id: users_id } });
            dataUser.dataValues.data_players = (await db.DataPlayers.findOne({
                where: {
                    users_id: users_id
                }
            }));

            dataUser.dataValues.email = user.email;

            return {
                ...dataUser.dataValues
            };
        } catch (e) {
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
            const { users_id, old_email, new_email, name,
                surname, nickname, phone_num, location,
                date_birthday } = data;
            const user = await db.Users.findOne({ where: { id: users_id, email: old_email } });

            if (!user) {
                throw ApiError.NotFound("Пользователя с данным идентификатором не найдено");
            }

            const userNew = await db.Users.findOne({ where: { email: new_email } });

            if ((user) && (userNew) && (user.id != userNew.id)) {
                throw ApiError.BadRequest(`Почтовый адрес ${new_email} уже существует`);
            }

            const userNickname = await db.DataUsers.findOne({ where: { nickname: nickname }});
            if ((userNickname) && (userNickname.users_id != user.id)) {
                throw ApiError.BadRequest(`Никнейм ${nickname} уже существует`);
            }
            
            let updateValues = {
                name: name,
                surname: surname,
                nickname: nickname,
                phone_num: phone_num,
                location: location,
                // date_birthday: new Date(date_birthday)
            }

            // Обновление персональных данных пользователя
            await db.DataUsers.update(updateValues, { where: { users_id: users_id }, transaction: t });

            if ((user) && (!userNew)) {
                user.email = new_email;
                await user.update({ transaction: t });
            }

            await t.commit();

            return {
                ...updateValues,
                users_id: users_id
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
                if(fs.existsSync(dataUser.ref_image)){
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
}

export default new PlayerService();