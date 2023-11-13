/* Импорты */
import dotenv from 'dotenv';
dotenv.config({ path: `.${process.env.NODE_ENV}.env` });
import express from "express";
import config from "config";
import logger from "./logger/logger.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import webApiConfig from "./config/web.api.json" assert { type: "json" };
import "./utils/array.js";
import { AuthRouteBase } from './constants/routes/auth.js';
import { SecurityRouteBase } from './constants/routes/security.js';
import { ModeratorRouteBase } from './constants/routes/moderator.js';
import { CreatorRouteBase } from './constants/routes/creator.js';
import { GeocoderRouteBase } from './constants/routes/geocoder.js';
import { MapRouteBase } from './constants/routes/map.js';
import { PlayerRouteBase } from './constants/routes/player.js';
import PlayerRouter from './routers/player-routers.js';
import MapRouter from './routers/map-routers.js';
import GeocoderRouter from './routers/geocoder-routers.js';
import AuthRouter from './routers/auth-routers.js';
import SecurityRouter from './routers/security-routers.js';
import ModeratorRouter from './routers/moderator-routes.js';
import CreatorRouter from './routers/creator-routers.js';
import errorMiddleware from './middlewares/error-middleware.js';
import db from "./db/index.js";
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import ExpressSwaggerGenerator from 'express-swagger-generator';
import swiggerOptions from './config/swagger.options.js';
import mathCircle from './math/circle.js';

/* Добавление поддержки require в ES Modules */
import { createRequire } from "module";
import jwtService from './services/token/jwt-service.js';
const require = createRequire(import.meta.url);
const socket = require('socket.io');

// Получение названия текущей директории
const __dirname = dirname(fileURLToPath(import.meta.url));
// Загрузка Swagger документации из каталога docs
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'docs.yaml'));

// Инициализация экземпляра express-приложения
const app = express();

// Если разрешена демонстрация устаревшей версии Swagger
if (config.get("doc.swagger2") === true) {
    // то демонстрируем документацию помимо OpenAPI 3 версию документации Open API 2
    const expressSwaggerGenerator = ExpressSwaggerGenerator(express());
    expressSwaggerGenerator(swiggerOptions(__dirname));
}

// Добавление в промежуточкое ПО раздачу статики из директории public
app.use('/public', express.static('public'));
// Добавление обработки запросов с JSON
app.use(express.json({ extended: true }));
// Добавление парсинка куки
app.use(cookieParser());
// Добавление вывода документации сервиса
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Настройка CORS-политик
app.use(cors({
    credentials: true,
    origin: webApiConfig['web_api'].map((value) => {
        return value;
    })
}));
// Связывание глобальных маршрутов с роутерами
app.use(AuthRouteBase, AuthRouter);
app.use(SecurityRouteBase, SecurityRouter);
app.use(CreatorRouteBase, CreatorRouter);
app.use(ModeratorRouteBase, ModeratorRouter);
app.use(GeocoderRouteBase, GeocoderRouter);
app.use(MapRouteBase, MapRouter);
app.use(PlayerRouteBase, PlayerRouter);
// Добавление промежуточного ПО для обработки ошибок
app.use(errorMiddleware);

const PORT = config.get('port') || 5000;

/**
 * Запуск express-приложения (начало прослушивания по определённому порту)
 * @returns
 */
const start = () => {
    try {
        // Начало прослушивания конкретного порта
        const server = app.listen(PORT, () => console.log(`Сервер запущен с портом ${PORT}`));
        logger.info({
            port: PORT,
            message: "Запуск сервера"
        });

        // Возвращение экземпляра
        return server;
    } catch (e) {
        logger.error({
            message: e.message
        });

        process.exit(1);
    }
}

const server = start();

/* Логика работы с Socket.IO */
const dataUsers = [];       // Глобальный объект, содержащий уникальные данные каждого пользователя (вместо БД)
let gameProcess = true;     // Игровой процесс (активация игрового процесса)

/**
 * Проверка на существование пользователя по определённым данным элемента
 * @param {*} data Данные подключений
 * @param {*} element Данные элемента
 * @returns {number} Флаг, характеризующий существование подключения или его отсутствие 
 */
const duExistsUser = (data, element) => {
    if ((!element.users_id)
        || (!element.access_token)
        || (!element.socket_id)
        || (!Array.isArray(data))
    ) {
        return false;
    }

    for (let i = 0; i < data.length; i++) {
        if ((data[i].users_id === element.users_id)
            && (data[i].socket_id === element.socket_id)) {
            return true;
        }
    }

    return false;
}

/**
 * Проверка на существование пользователя по определённому идентификатору сокета
 * @param {*} data Данные подключений
 * @param {*} socket_id Идентификатор подключения по сокету
 * @returns {number} Идентификатор подключения
 */
const duExistsValueIndex = (data, socket_id) => {
    if (!Array.isArray(data)) {
        return (-1);
    }

    for (let i = 0; i < data.length; i++) {
        if (data[i].socket_id === socket_id) {
            return i;
        }
    }

    return (-1);
}

/**
 * Получение индекса из массива всех подключений по идентификатору пользователя
 * @param {*} data Данные всех подключений
 * @param {*} id Идентификатор пользователя
 * @returns {number} Идентификатор подключения
 */
const duGetIndexById = (data, id) => {
    if (!Array.isArray(data)) {
        return (-1);
    }

    for (let i = 0; i < data.length; i++) {
        if (data[i].users_id === id) {
            return i;
        }
    }

    return (-1);
}

/**
 * Функция задержки
 * @param {*} ms Время задержки в миллисекундах
 * @returns {Promise} Промис ожидания
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Генерация рандомного числа из диапазона [min; max]
 * @param {number} min Минимальное значение диапазона
 * @param {number} max Максимальное значение диапазона
 * @returns {number} Число из диапазона [min; max]
 */
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Создание сервера Socket.IO
const io = socket(server);

/*
 * Правила добавления прослушивания определённых событий на сокеты:
 * 1) Уменьшить степень вложенности
 * 2) Каждая обработка должна быть максимально самостоятельна по 
 * отношению к базе данных. На практике было подтверждено то, что
 * когда на сервере или клиенте есть вложенные on, обрабатывающие
 * события, которые возникают часто, то это приводит к непоправимым
 * торможениям игрового процесса (исключение - глобальные объекты)
 */

// Обработка глобального события - "Подключение нового пользователя к серверу"
io.on("connection", (socket) => {

    // Обработка события - "Авторизация пользователя"
    socket.on("authentication", async (data) => {
        try {
            // Аутентификация пользователя и занесение его в глобальный объект
            const dataEx = JSON.parse(data);
            const usersData = jwtService.decode(dataEx.access_token);

            let checks = {
                token: false,
                exists: false
            };

            const user = await db.Users.findOne({
                where: {
                    id: usersData.users_id
                }
            });

            if (!user) {
                socket.emit("authentication_failed");
                return;
            }

            checks.exists = true; //await token_access.checkTokenAccess(user_data.users_email);
            checks.token = true; //await token_access.checkToken(user_data.token);

            if ((!checks.token) || (!checks.exists)) {
                socket.emit("authentication_failed");
                return;
            }

            // Если данный пользователь уже авторизован в системе
            if (duExistsUser(dataUsers, {
                socket_id: socket.id,
                users_id: usersData.users_id,
                access_token: dataEx.access_token
            })) {
                socket.emit("authentication_success");
                return;
            }

            // Иначе добавляем нового пользователя во временную БД
            dataUsers.push({
                users_id: usersData.users_id,
                socket_id: socket.id,
                access_token: dataEx.access_token,
            });

            console.log("Hello");
            socket.emit("authentication_success");
        } catch (e) {
            console.log(e);
        }
    });

    // Обработка события - "Получение текущего статуса игрока"
    socket.on("status", async () => {
        try {
            // Поиск пользователя из списка подключенных
            let index = duExistsValueIndex(dataUsers, socket.id);
            if (index < 0) {
                return;
            }

            // Обработка определения судейский прав
            const judge = await db.FixJudges.findAll({
                where: {
                    users_id: dataUsers[index].users_id
                }
            });

            // Отсеивание тех судейских записей, которые в данный момент не актуальны
            await judge.removeIfAsync(async (item) => {
                // Получение информации о завершённой игре
                const isCompleted = await db.CompleteGames.findOne({
                    where: {
                        info_games_id: item.info_games_id,
                        commands_id: item.commands_id
                    }
                });

                // Получение информации об игре
                const isGameEnding = await db.InfoGames.findOne({
                    where: {
                        id: item.info_games_id,
                        date_end: {
                            [db.Sequelize.Op.lt]: (new Date())
                        }
                    }
                });

                // Если игра была завершена командой или завершена фактически (из-за её времени), то удаляем информацию о судействе
                return (isCompleted || isGameEnding);
            });

            // Если игрок судья
            if (judge.length > 0) {
                // то, возвращаем игроку статус судьи
                socket.emit("status_on", JSON.stringify({
                    player: false,
                    judge: true,
                    player_status: 0
                }),
                    JSON.stringify({
                        ...judge[0].dataValues
                    })
                );

                // Отправка сообщения пользователю - "Очисти все игровые метки на карте"
                socket.emit("clear_games_marks");

                // Завершение определения статуса игрока (судья)
                return;
            }

            // Получение информации об игроке
            const dataPlayers = await db.DataPlayers.findOne({
                where: {
                    users_id: dataUsers[index].users_id
                }
            });

            // Если данных об игроке нет
            if (!dataPlayers) {
                // то, отправляем статус - "Отсутствие статуса"
                socket.emit("status_off", JSON.stringify({
                    player: false,
                    judge: false,
                    player_status: 0
                }));

                // Завершение определения статуса игрока (пользователь)
                return;
            }

            // Если данные об игроке есть
            if (!dataPlayers.commands_id) {
                // то, отправляем статус - "Обычный пользователь"
                socket.emit("status_on", JSON.stringify({
                    player: false,
                    judge: false,
                    player_status: 0
                }));

                // Очистка игровых меток на карте
                socket.emit("clear_games_marks");

                // Завершение определения статуса игрока (пользователь)
                return;
            }

            // Установка статуса пользователя как игрока (по умолчанию)
            let playerStatus = 1;

            // Получение информации об операторе квеста
            const video = await db.VideoShooters.findOne({
                where: {
                    data_players_id: dataPlayers.id
                }
            });

            // Если игрок оператор
            if (video) {
                // то, устанавливаем ему статус оператора
                playerStatus = 2;
            }

            // Получаем информацию о текущей игре
            const currentGames = await db.CurrentGames.findOne({
                where: {
                    commands_id: dataPlayers.commands_id,
                }
            });

            // Если текущая игра отсутствует
            if (!currentGames) {
                // то, отправляем статус - "Обычный пользователь"
                socket.emit("status_on", JSON.stringify({
                    player: false,
                    judge: false,
                    player_status: 0
                }));

                // Если текущей игры нет, то нет необходимости быть закреплённым за определённую комнату
                if (!(socket.rooms.has(dataPlayers.commands_id))) {
                    // Для каждой команды создаётся своя комната, в которую посылается множество событий
                    // для команды, а если текущей игры нет и пользователь находится в командной комнате
                    // то есть смысл удалить его из этой комнаты (всех пользователей удаляем)
                    socket.leave(dataPlayers.commands_id);
                }
                socket.emit("clear_games_marks");

                // Завершение определения статуса игрока (пользователь)
                return;
            } else {
                // Если текущая игра присутствует - продолжаем определение конечной роли пользователя

                // Поиск регистрационной записи
                let registerGame = await db.RegisterCommands.findOne({
                    where: {
                        info_games_id: currentGames.info_games_id,
                        commands_id: currentGames.commands_id
                    }
                });

                // Поиск всех игр команды
                let games = await db.Games.findAll({
                    where: {
                        register_commands_id: registerGame.id,
                    }
                });

                // Поиск всех завершённых игр команды
                let gamesFinisheds = await db.FinishedGames.findAll({
                    where: {
                        game_id: {
                            [db.Sequelize.Op.in]: games.map((item) => item.id)
                        }
                    }
                });

                // Подсчёт количества игр в рамках одного квеста
                let countQuests = (await db.GamesQuests.findAll({
                    where: {
                        info_games_id: currentGames.info_games_id
                    }
                })).length;

                // Количество квестов в игре соответствует количеству пройденных квестов (вся игра выполнена командой)
                if (gamesFinisheds.length === countQuests) {
                    // Обработка обстоятельства, в котором игра находится
                    // на этапе судейской проверки
                    socket.emit("status_on", JSON.stringify({
                        player: false,
                        judge: false,
                        player_status: 0
                    }));

                    // Завершение определения статуса игрока (пользователь)
                    return;
                } else {
                    // Иначе - игры ещё не завершены, а значит игра продолжается
                    // Перезаписываем список игр, которые ещё не были пройдены (вдруг к этому моменту что-то поменялось)
                    games = await db.Games.findAll({
                        where: {
                            id: {
                                [db.Sequelize.Op.and]: [
                                    { [db.Sequelize.Op.notIn]: gamesFinisheds.map((item) => item.game_id) },
                                    { [db.Sequelize.Op.in]: games.map((item) => item.id) }
                                ]
                            }
                        }
                    });

                    // Если игра ещё не была поставлена на очередь
                    if (games.length === 0) {
                        // то, отправляем игроку пустой статус (без ухода из групповой комнаты)
                        socket.emit("status_on", JSON.stringify({
                            player: false,
                            judge: false,
                            player_status: 0
                        }));

                        // Отправив повторный статус пользователь узнает прошёл ли он игру или находится игра
                        // на этапе судейской оценки

                        // Завершение определения статуса игрока (пользователь)
                        return;
                    } else {
                        // Теперь известно, что games[0] - текущая игра за которой закреплена команда
                        const currentGameQuest = games[0];
                        // Получаем информацию о квесте текущей игры (с геолокацией)
                        const currentGameQuestInfo = await db.Quests.findOne({
                            where: {
                                id: currentGameQuest.quests_id
                            },
                            include: {
                                model: db.Marks
                            }
                        });

                        // Подключение на прослушивание игровых сообщений внутри команды
                        if (!(socket.rooms.has(currentGames.commands_id))) {
                            // Добавление игрока в комнату команды (название команды уникально)
                            socket.join(currentGames.commands_id);
                        }

                        // Отправка игроку информации, о текущем задании
                        socket.emit("status_on", JSON.stringify({
                            player: true,
                            judge: false,
                            player_status: playerStatus
                        }),
                            JSON.stringify({
                                task: currentGameQuestInfo.task,
                                hint: currentGameQuestInfo.hint,
                                number: ((await Games.findAll({
                                    where: {
                                        id: {
                                            [db.Sequelize.Op.in]: gamesFinisheds.map((item) => item.game_id)
                                        }
                                    }
                                })).length + 1),
                                ...currentGameQuest.dataValues,
                                current_games_id: currentGames.id
                            })
                        );

                        // Если данный квест видим
                        if (currentGameQuest.view) {
                            // То отправляем сообщение пользователям - "Визуализируй видимый квест"
                            socket.emit("set_view_current_quest", JSON.stringify({
                                radius: currentGameQuestInfo.radius,
                                lat: currentGameQuestInfo.dataValues.mark.dataValues.lat,
                                lng: currentGameQuestInfo.dataValues.mark.dataValues.lng
                            }));

                            // Отправка сообщения всем игрокам команды о том, 
                            // что необходимо загрузить медиафайл с инструкцией
                            socket.emit("load_media_instructions");
                        } else {
                            // Очистка меток
                            socket.emit("clear_games_marks");

                            // Не загружаем медиафайл с инструкцией
                            socket.emit("not_load_media_instructions");
                        }
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    });

    // Обработка события - "Получение текущего статуса команды"
    socket.on("command_status", async () => {
        try {
            // Поиск пользователя из списка подключенных
            let index = duExistsValueIndex(dataUsers, socket.id);
            if (index < 0) {
                return;
            }

            // Получение информации об игроке
            const dataPlayers = await db.DataPlayers.findOne({
                where: {
                    users_id: dataUsers[index].users_id
                }
            });

            // Если информации об игроке нет - не обрабатываем событие
            if (!dataPlayers) {
                return;
            }

            // Если у игрока нет команды
            if (!dataPlayers.commands_id) {
                // То отправляем пустой статус
                socket.emit("command_status_on", JSON.stringify({
                    status: 0,
                    commands_id: dataPlayers.commands_id
                }));
                return;
            }

            // Получаем информацию о команде (создатель ли команды данный игрок)
            const isCreator = await db.Commands.findOne({
                where: {
                    users_id: dataPlayers.users_id,
                    id: dataPlayers.commands_id
                }
            });

            // Если данный игрок не создатель команды - отправляем статус участника команды
            if (!isCreator) {
                socket.emit("command_status_on", JSON.stringify({
                    status: 1,
                    commands_id: dataPlayers.commands_id
                }));
            } else {
                // иначе, отправляем статус создателя команды
                socket.emit("command_status_on", JSON.stringify({
                    status: 2,
                    commands_id: dataPlayers.commands_id
                }));
            }
        } catch (e) {
            console.log(e);
        }
    });

    // Обработка события - "Получение отдельным членом команды всех координат других пользователей"
    socket.on("set_player_coordinates", async (data) => {
        try {
            let index = duExistsValueIndex(dataUsers, socket.id);
            if (index < 0) {
                return;
            }

            const dataPlayers = await db.DataPlayers.findOne({
                where: {
                    users_id: dataUsers[index].users_id
                }
            });

            if ((!dataPlayers) || (!dataPlayers.commands_id)) {
                return;
            }

            socket.to(dataPlayers.commands_id).emit("add_player_coordinates", data);
        } catch (e) {
            console.log(e);
        }
    });

    // Обработка события -
    // Запрос пользователем всех текущих координат пользователей, которые находятся
    // вместе с ним в команде и в данный момент в сети
    socket.on("coordinates_players", async () => {
        try {
            // Отправка всем членам команды события для получения их текущих координат
            let index = duExistsValueIndex(dataUsers, socket.id);
            if (index < 0) {
                return;
            }

            const dataPlayers = await db.DataPlayers.findOne({
                where: {
                    users_id: dataUsers[index].users_id
                }
            });

            if ((!dataPlayers) || (!dataPlayers.commands_id)) {
                return;
            }

            socket.to(dataPlayers.commands_id).emit('get_player_coordinates');
        } catch (e) {
            console.log(e);
        }
    });

    // Обработка события - "Запись текущих координат игрока в базу данных"
    socket.on("set_current_coordinates", async (data) => {
        const t = await db.sequelize.transaction();
        try {
            const location = JSON.parse(data);
            let index = duExistsValueIndex(dataUsers, socket.id);

            if (index < 0) {
                return;
            }

            const user = dataUsers[index];
            if (!user.users_id) {
                return;
            }

            const coordPlayers = await db.CoordPlayers.findOne({
                where: {
                    users_id: user.users_id
                }
            });

            if (!coordPlayers) {
                await db.CoordPlayers.create({
                    users_id: user.userd_id,
                    lat: location.lat,
                    lng: location.lng
                }, { transaction: t });

                await t.commit();
                return;
            }

            await coordPlayers.update({
                lat: location.lat,
                lng: location.lng
            }, { transaction: t });

            await t.commit();
        } catch (e) {
            await t.rollback();
            console.log(e);
        }
    });

    // Обработка события - "Получение координат пользователя из базы данных"
    socket.on("get_my_coordinates", async () => {
        try {
            const index = duExistsValueIndex(dataUsers, socket.id);
            if (index < 0)
                return;

            const dataCoords = await db.CoordPlayers.findOne({
                where: {
                    users_id: dataUsers[index].users_id
                }
            });

            if (!dataCoords) {
                return;
            }

            // Отправка координат из БД на устройство
            socket.emit("set_my_coordinates", JSON.stringify({
                lat: dataCoords.lat,
                lng: dataCoords.lng,
            }));
        } catch (e) {
            console.log(e);
        }
    });

    // Обработка события - "Отключения пользователя от текущего подключения"
    socket.on('disconnect', async () => {
        try {
            const index = duExistsValueIndex(dataUsers, socket.id);
            if (index >= 0) {
                const value = await db.DataPlayers.findOne({
                    where: {
                        users_id: dataUsers[index].users_id
                    }
                });

                if ((value) && (value.commands_id)) {
                    // Отправка сообщения в командную комнату о том, что их игрок отключился от системы
                    socket.to(value.commands_id).emit('team_player_disconnect', JSON.stringify({
                        users_id: value.users_id
                    }));
                }
                dataUsers.splice(index, 1); // Удаление пользователя из глобального объекта
            }
        } catch (e) {
            console.log(e);
        }
    });
});

// Обработка выбора судей для судейства существующих текущих игр
(async () => {
    while (gameProcess) {
        try {
            // Получение списка всех игр
            const games = await db.CurrentGames.findAll();

            // Фильтруем список игр таким образом, что остаются 
            // только те текущие игры, которые остались без судьи
            await games.removeIfAsync(async (item) => {
                const fixJudges = await db.FixJudges.findOne({
                    where: {
                        commands_id: item.commands_id,
                        info_games_id: item.info_games_id
                    }
                });

                return (fixJudges) ? true : false;
            });

            // Формирование списка идентификаторов всех команд, которые в
            // данный момент имеют текущую игру
            const allCommandsId = games.map((item) => {
                return item.commands_id
            });

            for (let i = 0; i < games.length; i++) {
                // Алгоритм закрепления судьи за определённой командой
                // Описание:
                // Проихсодит получение всех игроков, которые не принадлежат командам,
                // которые имеют в настоящий момент текущую игру (чтобы не отвлекать других игроков от судейской роли),
                // в случае, если таких игроков нет, то происходит рандомный выбор игрока судьи из всех имеющихся игроков [NOT CORRECT]

                // Выбор всех игроков, которые не принадлежат ни одной команде
                let players = await db.DataPlayers.findAll({
                    where: {
                        commands_id: {
                            [db.Sequelize.Op.notIn]: allCommandsId
                        }
                    }
                });

                // Если таких игроков нет, то выбираем судью из всех имеющихся игроков (рандомным образом)
                if (players.length == 0) {
                    players = await db.DataPlayers.findAll();
                }

                // Отсеивание игроков, которые уже являются судьями для текущих игр
                await players.removeIfAsync(async (item) => {
                    // Считывание судейской статистики данного игрока
                    const fixJudges = await db.FixJudges.findAll({
                        where: {
                            users_id: item.users_id
                        }
                    });

                    // Фильтрация судейской статистики данного игрока
                    await fixJudges.removeIfAsync(async (item) => {
                        const isCompleted = await db.CompleteGames.findOne({
                            where: {
                                info_games_id: item.info_games_id,
                                commands_id: item.commands_id
                            }
                        });

                        const isGameEnding = await db.InfoGames.findOne({
                            where: {
                                id: item.info_games_id,
                                date_end: {
                                    [db.Sequelize.Op.lt]: (new Date())
                                }
                            }
                        });

                        return (isCompleted || isGameEnding);
                    });

                    return (fixJudges.length > 0) ? true : false;
                });

                if (players.length > 0) {
                    // Выбор рандомного игрока
                    const index = getRandomInt(0, (players.length - 1));

                    // Добавление выбранного игрока за текущей игрой в качестве судьи
                    await db.FixJudges.create({
                        users_id: players[index].users_id,
                        commands_id: games[i].commands_id,
                        info_games_id: games[i].info_games_id
                    });
                }
            }
        } catch (e) {
            console.log(e);
        }

        await sleep(1000);
    }
})();

// Автоматизация установки текущих игр для команд, которые были на них зарегистрированы
(async () => {
    while (gameProcess) {
        try {
            // Выбор всех команд, у которых имеются текущие игры
            const teamsHaveGames = await db.CurrentGames.findAll();

            // Выбор всех команд, у которых текущих игр не имеется
            const commands = await db.Commands.findAll({
                where: {
                    id: {
                        [db.Sequelize.Op.notIn]: teamsHaveGames.map((item) => item.commands_id)
                    }
                }
            });

            if (commands.length > 0) {
                // Выбор всех записей в таблице регистрации, которые определяют регистрацию команды на игру
                const registers = await db.RegisterCommands.findAll({
                    where: {
                        commands_id: {
                            [db.Sequelize.Op.in]: commands.map((item) => item.id)
                        }
                    }
                });

                // Фильтрация данных в таблице регистрации: нужны только те записи регистрации для
                // команд, которые не были пройдены командами, а также записи, где игры,
                // на которые были зарегистрированы команды ещё не закончились
                await registers.removeIfAsync(async (item) => {
                    const value1 = await db.CompleteGames.findOne({
                        where: {
                            commands_id: item.commands_id,
                            info_games_id: item.info_games_id
                        }
                    });

                    // Поиск игры, которая уже началась по данной записи в таблице регистрации
                    const value2 = await db.InfoGames.findOne({
                        where: {
                            id: item.info_games_id,
                            // Дата начала игры меньше текущей даты (или равна ей)
                            date_begin: {
                                [db.Sequelize.Op.lte]: (new Date())
                            },
                            // И дата завершения игры больше текущей даты
                            date_end: {
                                [db.Sequelize.Op.gt]: (new Date())
                            }
                        }
                    });

                    // Если игра завершена или нет такой игры, которая началась, но ещё не завершалась,
                    // то удаляем данную запись из таблицы регистрации
                    return ((value1) || (!value2));
                });

                // Перебираем все записи, по которым необходимо добавить новую текущую игру
                // для каждой команды, которая на такую игру зарегистрировалась
                for (let i = 0; i < registers.length; i++) {
                    await db.CurrentGames.create({
                        commands_id: registers[i].commands_id,
                        info_games_id: registers[i].info_games_id
                    });
                }
            }
        } catch (e) {
            console.log(e);
        }

        await sleep(1000);
    }
})();

// Данная функция просматривает текущие игры и определяет
// на каком этапе находятся игроки, которые её проходят
(async () => {
    while (gameProcess) {
        try {
            // Получение списка команд, которые зарегистрированы на игру
            // register_commands сохраняет в себе все регистрации команд на определённую игру
            // а current_games только на определённую 1-у игру, которая впоследствии перезаписывается
            // т.к. текущая игра у команды может быть только одна
            const commands = await db.CurrentGames.findAll();

            // Обработка завершения игр и отсеивание их из всех обнаруженных 
            // текущих игр, а также их завершения в базе данных
            await commands.removeIfAsync(async (item) => {
                // Определение завершённой игры
                const isCompleted = await db.CompleteGames.findOne({
                    where: {
                        info_games_id: item.info_games_id,
                        commands_id: item.commands_id
                    }
                });

                // Поиск игры, которая уже закончилась, но была текущей для данной команды
                /*const isGameEnding = await InfoGames.findOne({
                    where: {
                        id: item.info_games_id,
                        date_end: {
                            [Sequelize.Op.lt]: (new Date())
                        }
                    }
                });

                const result = (isCompleted || isGameEnding);*/

                // Если данная текущая игра пройдена данной командой или была завершена,
                // то удалить данную игру из БД и из рассматриваемого множества текущих игр
                if (isCompleted) {
                    // Удаление зафиксированного судьи ...
                    // [функционал удаления на данный момент является условным,
                    // такое решение было принято для того, чтобы не вмешиваться в уже имеющуюся
                    // структуры БД на момент MVP для меньших трудозатрат. Это не мешает игровому процессу]

                    // Удаление текущей игры
                    await db.CurrentGames.destroy({
                        where: {
                            info_games_id: item.info_games_id,
                            commands_id: item.commands_id
                        }
                    });
                }

                return (isCompleted) ? true : false;
            });

            for (let i = 0; i < commands.length; i++) {
                // Поиск регистрационной записи, для текущей игры рассматриваемой команды
                const registerGame = await db.RegisterCommands.findOne({
                    where: {
                        info_games_id: commands[i].info_games_id,
                        commands_id: commands[i].commands_id
                    }
                });

                // Поиск всех игр команды по текущей игре
                const games = await db.Games.findAll({
                    where: {
                        register_commands_id: registerGame.id,
                    }
                });

                // Все квесты данной игры
                const gameQuests = await db.GamesQuests.findAll({
                    where: {
                        info_games_id: commands[i].info_games_id
                    }
                });

                // Определение всех заданий для текущей игры и текущей команды, которые были пройдены
                const finisheds = await db.FinishedGames.findAll({
                    where: {
                        game_id: {
                            [db.Sequelize.Op.in]: games.map((item) => item.id)
                        }
                    }
                });

                const gamesFinished = [];

                // Отсеивание тех игр для текущей игры, которые были пройдены
                await games.removeIfAsync(async (item) => {
                    let flag = false;
                    for (let i = 0; i < finisheds.length; i++) {
                        if (finisheds[i].game_id == item.id) {
                            flag = true;
                            gamesFinished.push(item);
                            break;
                        }
                    }

                    return flag;
                });

                // Формирование квестов, которые не были пройдены данной командой
                gameQuests.removeIf((item) => {
                    for (let i = 0; i < gamesFinished.length; i++) {
                        if (gamesFinished[i].quests_id == item.quests_id) {
                            return true;
                        }
                    }

                    return false;
                });

                const infoGames = await db.InfoGames.findOne({
                    where: {
                        id: commands[i].info_games_id
                    }
                });

                // Проверка даты текущей игры, если дата завершения 
                // игры меньше либо равна текущей дате, то игра считается пройденной
                // и игра завершается
                if ((new Date(infoGames.date_end)) <= (new Date())) {
                    const completeGames = await db.CompleteGames.findOne({
                        where: {
                            info_games_id: commands[i].info_games_id
                        }
                    });

                    const currentGames = await db.CurrentGames.findOne({
                        where: {
                            info_games_id: commands[i].info_games_id,
                            commands_id: commands[i].commands_id
                        }
                    });

                    // Отправка сообщения о завершении игры
                    // всем игрокам, которые находятся в сети
                    // для данной команды
                    io.to(commands[i].commands_id).emit("game_over");

                    if (!completeGames) {
                        let score = 0;
                        for (let i = 0; i < finisheds.length; i++) {
                            const judgeScore = await db.JudgeScores.findOne({
                                where: {
                                    finished_games_id: finisheds[i].id
                                }
                            });

                            if (judgeScore) {
                                score += judgeScore.score;
                            }
                        }

                        await db.CompleteGames.create({
                            commands_id: commands[i].commands_id,
                            info_games_id: commands[i].info_games_id,
                            completed: false,
                            current_score: score,
                        });

                        // Удаление судъи из списка (не удаляется, т.к. необходимо сохранять ссылку на судью)
                        // ########################### [comment='judge-begin']
                        /*const fixJudges = await FixJudges.findOne({
                            commands_id: currentGames.commands_id,
                            info_games_id: currentGames.info_games_id
                        });

                        await fixJudges.destroy();*/
                        // ########################### [comment-end='judge-begin']

                        // Удаление текущей игры
                        await currentGames.destroy();
                    } else {
                        // Обновляем статус игры на не пройденную
                        if (!completeGames.completed) {
                            await completeGames.update({
                                completed: false
                            });
                        }

                        // ########################### [comment='judge-begin']
                        /*const fixJudges = await FixJudges.findOne({
                            commands_id: currentGames.commands_id,
                            info_games_id: currentGames.info_games_id
                        });

                        await fixJudges.destroy();*/
                        // ########################### [comment-end='judge-begin']
                        await currentGames.destroy();
                    }
                }

                if (games.length === 0) {
                    // Если нет текущей игры, то инициируется попытка её создания
                    if (gameQuests.length === 0) {
                        // Если все квесты были пройдены, то необходимо узнать оценил ли судъя каждый
                        // квест по отдельности, если оценил - то игра считается полностью пройденной, если 
                        // ещё не дал оценку хотя бы 1 квесту, то игра на этапе оценки. Когда игра на этапе оценки
                        // команда не может быть зарегистрирована на игру - вся команда ожидает результатов
                        const judgeScores = [];
                        for (let i = 0; i < finisheds.length; i++) {
                            const value = await db.JudgeScores.findOne({
                                where: {
                                    finished_games_id: finisheds[i].id
                                }
                            });

                            if (value) {
                                judgeScores.push(value);
                            }
                        }

                        const currentGames = await db.CurrentGames.findOne({
                            where: {
                                info_games_id: commands[i].info_games_id,
                                commands_id: commands[i].commands_id
                            }
                        });

                        const countQuests = await db.GamesQuests.findAll({
                            where: {
                                info_games_id: commands[i].info_games_id
                            }
                        });

                        if ((judgeScores.length === finisheds.length)
                            && (finisheds.length === countQuests.length)) {
                            // Если количество записей в таблице оценок равно количеству
                            // записей в таблице завершённых меток, то игра считается пройденной полностью
                            // (также необходимо чтобы оба значения были равны общему числу квестов в текущей игре)
                            // и оцененной судъей полностью
                            const completeGames = await db.CompleteGames.findOne({
                                where: {
                                    info_games_id: commands[i].info_games_id
                                }
                            });

                            io.to(commands[i].commands_id).emit("game_over");
                            if (!completeGames) {
                                let score = 0;
                                for (let i = 0; i < finisheds.length; i++) {
                                    const judgeScore = await db.JudgeScores.findOne({
                                        where: {
                                            finished_games_id: finisheds[i].id
                                        }
                                    });

                                    if (judgeScore) {
                                        score += judgeScore.score;
                                    }
                                }

                                await db.CompleteGames.create({
                                    commands_id: commands[i].commands_id,
                                    info_games_id: commands[i].info_games_id,
                                    completed: true,
                                    current_score: score,
                                });

                                // ########################### [comment='judge-begin']
                                /*const fixJudges = await FixJudges.findOne({
                                    commands_id: currentGames.commands_id,
                                    info_games_id: currentGames.info_games_id
                                });
        
                                await fixJudges.destroy();*/
                                // ########################### [comment-end='judge-begin']

                                await currentGames.destroy();
                            } else {
                                // Обновляем статус игры на пройденную
                                if (!completeGames.completed) {
                                    await completeGames.update({
                                        completed: true
                                    });
                                }

                                // ########################### [comment='judge-begin']
                                /*const fixJudges = await FixJudges.findOne({
                                    commands_id: currentGames.commands_id,
                                    info_games_id: currentGames.info_games_id
                                });
       
                                await fixJudges.destroy();*/
                                // ########################### [comment-end='judge-begin']

                                await currentGames.destroy();
                            }
                        }
                    } else {
                        // Свободные квесты есть, а значит - их можно выдать команде для их прохождения
                        const newQuest = await db.Quests.findOne({
                            where: {
                                id: gameQuests[0].quests_id
                            }
                        });

                        // Добавление новой игры для команды
                        await db.Games.create({
                            view: false,
                            commands_id: commands[i].commands_id,
                            register_commands_id: registerGame.id,
                            quests_id: newQuest.id
                        });
                    }
                } else {
                    // Текущая игра есть, необходимо определить её видимость для игроков.
                    // В случае, когда текущая игра, за которой они закреплены, видима,
                    // игроки получают об этом уведомление. И когда они все собираются у точки
                    // происходит выбор из команды одного человека, который будет оператором,
                    // и на все устройства происходит загрузка видео, которое подразумевает собой выполнение
                    // какого-либо действия

                    // Получение информации о текущем задании
                    const currentGame = await db.Games.findOne({
                        where: {
                            id: games[0].id
                        }
                    });

                    // Для дальнейшего шага необходимо выполнение условия "имеется текущее задание и оно ещё не видимо"
                    if ((currentGame) && (!currentGame.view)) {
                        // Определение текущего квеста по заданию
                        const currentQuest = await db.Quests.findOne({
                            where: {
                                id: currentGame.quests_id
                            },
                            include: {
                                model: Marks
                            }
                        });

                        // Определение игроков в текущей команде
                        const dataPlayers = await db.DataPlayers.findAll({
                            where: {
                                commands_id: commands[i].commands_id
                            }
                        });

                        // Фильтрация игроков: остаются лишь те, которые были
                        // подключены к сети, и которые не являются судьями для других игр
                        await dataPlayers.removeIfAsync(async (item) => {
                            const isJudge = await db.FixJudges.findOne({
                                where: {
                                    users_id: item.users_id,
                                    info_games_id: commands[i].info_games_id
                                }
                            });

                            return ((isJudge) || (duGetIndexById(dataUsers, item.users_id) < 0));
                        });

                        for (let i = 0; i < dataPlayers.length; i++) {
                            const value = await db.CoordPlayers.findOne({
                                where: {
                                    users_id: dataPlayers[i].users_id
                                }
                            });

                            // Проверяем координаты игрока только в том случае, когда он в сети и его координаты есть в БД
                            if (value) {
                                if (mathCircle.intersectionCircles(
                                    value.lat,
                                    value.lng,
                                    currentQuest.dataValues.mark.dataValues.lat,
                                    currentQuest.dataValues.mark.dataValues.lng,
                                    mathCircle.radiusLatLng(100),
                                    mathCircle.radiusLatLng(currentQuest.radius)
                                )) {
                                    // Если окружность игрока пересекла окружность квеста, то сделать текущий квест видимым
                                    // тем самым запустив процесс загрузки видео с медиасервера на устройство каждого пользователя
                                    // для получения задания и процесс определения того, кто будет являться оператором
                                    // от которого зависит перейдёт ли команда к следующему квесту или нет
                                    await currentGame.update({
                                        view: true
                                    });

                                    // После того, как метка была найдена из всех игроков в команде выбирается тот,
                                    // кто будет вести съёмку видео, которое будет отправлено на сервер в качестве
                                    // результата действий игроков (ответ на медиафайл квеста)

                                    const playerIndex = getRandomInt(0, (dataPlayers.length - 1));

                                    // Определение того, имеется ли в текущий момент видеооператор для данного задания
                                    const findVideoShooter = await db.VideoShooters.findOne({
                                        where: {
                                            games_id: currentGame.id
                                        }
                                    });

                                    if (!findVideoShooter) {
                                        // Если видеооператора для данного задания нет,
                                        // то добавляем его в базу данных
                                        await db.VideoShooters.create({
                                            games_id: currentGame.id,
                                            data_players_id: dataPlayers[playerIndex].id
                                        });
                                    }

                                    // Выходим из цикла, т.к. теперь текущее задание видно и можно
                                    // не сравнивать координаты всех меток с координатами игроков
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }

        await sleep(1000);
    }
})();
