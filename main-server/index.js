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
import fs from 'fs';

/* Добавление поддержки require в ES Modules */
import { createRequire } from "module";
import jwtService from './services/token/jwt-service.js';
import tokenService from './services/token/token-service.js';
import GameStatus from './constants/status/game-status.js';
import ViewStatus from './constants/status/view-status.js';
import QuestStatus from './constants/status/quest-status.js';
const require = createRequire(import.meta.url);
const socket = require('socket.io');

// Получение названия текущей директории
const __dirname = dirname(fileURLToPath(import.meta.url));
// Загрузка Swagger документации из каталога docs
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'docs.yaml'));

// Если нет директории public, то создаём её
if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
}

// Инициализация экземпляра express-приложения
const app = express();
let server = null;

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

let gameProcess = true;     // Игровой процесс (активация игрового процесса)
const PORT = config.get('port') || 5000;

let timerGlobal = null;
let lockGlobal = false;
let timerJudge = null;
let lockJudge = false;
let timerGame = null;
let lockGame = false;

/**
 * Запуск express-приложения (начало прослушивания по определённому порту)
 * @returns
 */
const handleStart = () => {
    try {
        // Начало прослушивания конкретного порта
        const serverHandle = app.listen(PORT, () => console.log(`Сервер запущен с портом ${PORT}`));
        logger.info({
            port: PORT,
            message: "Запуск сервера"
        });

        // Возвращение экземпляра
        return serverHandle;
    } catch (e) {
        logger.error({
            message: e.message
        });

        process.exit(1);
    }
}

server = handleStart();

const handleShutdown = () => {
    gameProcess = false;

    timerGlobal && clearTimeout(timerGlobal);
    timerJudge && clearTimeout(timerJudge);
    timerGame && clearTimeout(timerGame);

    timerGlobal = null;
    timerJudge = null;
    timerGame = null;

    server.close();

    console.log("Сервер остановлен");
}

process.on("SIGINT", () => {
    if (gameProcess) {
        handleShutdown();
        process.exit(0);
    }
});
process.on("SIGTERM", () => {
    if (gameProcess) {
        handleShutdown();
        process.exit(0);
    }
});
process.on("SIGHUP", () => {
    if (gameProcess) {
        handleShutdown();
        process.exit(0);
    }
});
process.on('exit', function () {
    if (gameProcess) {
        handleShutdown();
    }
});

/* Логика работы с Socket.IO */
const dataUsers = [];       // Глобальный объект, содержащий уникальные данные каждого пользователя (вместо БД)

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
const sleep = (ms) => {
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

    console.log("connection socket id: ", socket.id);

    // Обработка события - "Авторизация пользователя"
    socket.on("authentication", async (data) => {
        try {
            // Аутентификация пользователя и занесение его в глобальный объект
            const dataEx = JSON.parse(data);

            const tokenValid = tokenService.checkAccessToken(dataEx.access_token);
            if (!tokenValid) {
                socket.emit("authentication_failed");
                return;
            }

            // Декодированные по токену данные о пользователе
            const usersData = jwtService.decode(dataEx.access_token);
            const findUser = await tokenService.findTokenByAccessToken(usersData.users_id, dataEx.access_token);

            if (!usersData.users_id || !findUser) {
                socket.emit("authentication_failed");
                return;
            }

            // Фактические (в БД) данные о пользователе
            const user = await db.Users.findOne({
                where: {
                    id: usersData.users_id
                }
            });

            if (!user) {
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

            // Иначе добавляем нового пользователя во временную БД (заменить на Redis)
            dataUsers.push({
                users_id: usersData.users_id,
                socket_id: socket.id,
                access_token: dataEx.access_token,
            });

            socket.emit("authentication_success");
        } catch (e) {
            console.log(e);
        }
    });

    // Обработка события - "Получение текущего статуса игрока"
    socket.on("status", async () => {
        const t = await db.sequelize.transaction();

        try {
            // Поиск пользователя из списка подключенных
            let index = duExistsValueIndex(dataUsers, socket.id);
            if (index < 0) {
                return;
            }

            const dataUser = dataUsers[index];

            // Поиск игры, на который в данный момент пользователь зарегистрирован
            const userGame = await db.UsersGames.findOne({
                where: {
                    users_id: dataUser.users_id,
                    status: {
                        [db.Sequelize.Op.in]: [GameStatus.ACTIVE, GameStatus.COMPLETED]
                    }
                }
            });

            if (!userGame) {
                socket.emit("status_off");
                return;
            } else if (userGame.status === GameStatus.COMPLETED) {
                socket.emit("status_completed");
                return;
            }

            const infoGame = await db.InfoGames.findOne({
                where: {
                    id: userGame.info_games_id
                }
            });

            if (!infoGame) {
                // Пользователь не зарегистрирован ни на одну игру
                socket.emit("status_off");
                return;
            }

            // Пользователь зарегистрирован на какую-то игру, теперь необходимо понять его текущий выполняемый квест
            const currentExecQuest = await db.ExecQuests.findOne({
                where: {
                    users_games_id: userGame.id,
                    status: GameStatus.ACTIVE
                }
            });

            if (!currentExecQuest) {
                // Игры нет, проверяем прошёл ли пользователь всю игру
                const finishedQuests = await db.ExecQuests.findAll({
                    where: {
                        users_games_id: userGame.id,
                        status: GameStatus.FINISH
                    }
                });

                if (finishedQuests.length == 0) {
                    // На всякий случай завершаем игру, для целостности данных в БД
                    await userGame.update({
                        status: GameStatus.FINISH
                    }, { transaction: t });

                    await t.commit();

                    socket.emit("status_off");
                    return;
                } else {
                    await userGame.update({
                        status: GameStatus.COMPLETED
                    }, { transaction: t });

                    await t.commit();

                    // Игра пройдена с вероятностью 90%
                    socket.emit("status_completed");
                    return;
                }
            }

            // Присутствует текущий квест, необходимо отправить статус с информацией о текущем квесте
            const currentQuest = await db.Quests.findOne({
                where: {
                    id: currentExecQuest.quests_id
                }
            });

            if (!currentQuest) {
                // Пользователь не зарегистрирован ни на одну игру
                await userGame.update({
                    status: GameStatus.FINISH
                }, { transaction: t });

                await t.commit();

                socket.emit("status_off");
                return;
            }

            const currentMark = await db.Marks.findOne({
                where: {
                    id: currentQuest.marks_id
                }
            });

            if (!currentMark) {
                // Пользователь не зарегистрирован ни на одну игру
                await userGame.update({
                    status: GameStatus.FINISH
                }, { transaction: t });

                await t.commit();

                socket.emit("status_off");
                return;
            }

            // Отправляем статус о текущем квесте
            socket.emit(
                "status_on",
                JSON.stringify({
                    ...currentQuest.dataValues,
                    mark: currentMark.dataValues,
                    status: currentExecQuest.status,
                    view: currentExecQuest.view,
                    users_games_id: userGame.id
                })
            );
        } catch (e) {
            await t.rollback();
            console.log(e);
        }
    });

    // Обработка события - "Текущий квест найден, необходимо его визуализировать"
    socket.on("view_current_quest", async (data) => {
        const t = await db.sequelize.transaction();

        try {
            // Поиск пользователя из списка подключенных
            let index = duExistsValueIndex(dataUsers, socket.id);
            if (index < 0) {
                return;
            }

            const dataUser = dataUsers[index];
            if (!dataUser.users_id) {
                return;
            }

            if (!data) {
                return;
            }

            const parseData = JSON.parse(data);
            const userGame = await db.UsersGames.findOne({
                where: {
                    id: parseData.users_games_id,
                    users_id: dataUser.users_id
                }
            });

            if (!userGame) {
                return;
            }

            const execQuest = await db.ExecQuests.findOne({
                where: {
                    users_games_id: userGame.id,
                    quests_id: parseData.id,
                    view: ViewStatus.INVISIBLE
                }
            });

            if (!execQuest) {
                return;
            }

            // Обновление данных в БД по текущему квесту
            await execQuest.update({
                view: ViewStatus.VISIBLE
            }, { transaction: t });

            await t.commit();

            // Изменяем полученные данные
            parseData.view = ViewStatus.VISIBLE;

            // Отправляем новый статус текущему пользователю
            socket.emit(
                "status_on",
                JSON.stringify(parseData)
            );
        } catch (e) {
            await t.rollback();
            console.log(e);
        }
    });

    // Обработка события - "Текущий игровой квест завершён"
    socket.on("finished_quest", async (data) => {
        const t = await db.sequelize.transaction();
        try {
            let index = duExistsValueIndex(dataUsers, socket.id);

            if (index < 0) {
                return;
            }

            const dataUser = dataUsers[index];
            if (!dataUser.users_id) {
                return;
            }

            const parseData = JSON.parse(data);
            const userGame = await db.UsersGames.findOne({
                where: {
                    id: parseData.users_games_id,
                    users_id: dataUser.users_id
                }
            });

            if (!userGame) {
                return;
            }

            const execQuest = await db.ExecQuests.findOne({
                where: {
                    users_games_id: userGame.id,
                    quests_id: parseData.id,
                    view: ViewStatus.VISIBLE // Нельзя завершить квест, который не виден пользователю
                }
            });

            if (!execQuest) {
                return;
            }

            // Обновление данных в БД по текущему квесту (квест завершён)
            await execQuest.update({
                status: QuestStatus.FINISH,
            }, { transaction: t });

            const nonActiveQuest = await db.ExecQuests.findOne({
                where: {
                    users_games_id: userGame.id,
                    status: QuestStatus.NON_ACTIVE
                }
            });

            // Формируем следующий квест на очередь
            if(nonActiveQuest) {
                await nonActiveQuest.update({
                    status: QuestStatus.ACTIVE,
                }, { transaction: t });
            }

            await t.commit();

            // Отправляем сообщение "Запусти процесс получения повторного состояния" (корневая функция игрового статуса)
            socket.emit("repeat_status_request");
        } catch (e) {
            await t.rollback();
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

            socket.to(dataPlayers.commands_id).emit("add_player_coordinates", JSON.stringify({
                ...JSON.parse(data),
                users_id: dataPlayers.users_id
            }));
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

    socket.on("game_over_disconnect", async () => {
        try {
            let index = duExistsValueIndex(dataUsers, socket.id);

            if (index < 0) {
                return;
            }

            let room = null;
            for (let item of socket.rooms.values()) {
                if ((typeof (item) === "number") ||
                    (typeof (item) === "string" && !isNaN(item) && !isNaN(parseInt(item)))
                ) {
                    room = item;
                    break
                }
            }

            if (room && socket.rooms.has(room)) {
                socket.leave(room);
            }

            console.log("socket.rooms: ", socket.rooms);
            socket.emit("game_over_disconnect_success");
        } catch (e) {
            console.log(e);
        }
    });

    // Обработка события - "Отключения пользователя от текущего подключения"
    socket.on('disconnect', async () => {
        console.log("disconnection socket id: ", socket.id);

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


// Данная функция просматривает текущие игры и определяет
// на каком этапе находятся игроки, которые её проходят
timerGlobal = setInterval(async () => {
    if (!gameProcess) {
        return;
    }

    while (lockGlobal && gameProcess) {
        if (!gameProcess) {
            return;
        }

        await sleep(10);
    }

    if (!gameProcess) {
        return;
    }

    lockGlobal = true;
    const t = await db.sequelize.transaction();

    try {
        // Получение списка команд, которые зарегистрированы на игру
        // register_commands сохраняет в себе все регистрации команд на определённую игру
        // а current_games только на определённую 1-у игру, которая впоследствии перезаписывается
        // т.к. текущая игра у команды может быть только одна
        const commands = await db.CurrentGames.findAll();

        let repeatStatusRequest = [];

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
                // Удаление текущей игры
                await db.CurrentGames.destroy({
                    where: {
                        info_games_id: item.info_games_id,
                        commands_id: item.commands_id
                    }
                }, { transaction: t });
            }

            return (isCompleted) ? true : false;
        });

        // Проход по всем существующим командам
        for (let i = 0; i < commands.length; i++) {
            const commandItem = commands[i];

            if (!commandItem) {
                continue;
            }

            const command = await db.Commands.findOne({
                where: {
                    id: commandItem.dataValues.commands_id
                }
            });

            if (!command) {
                continue;
            }

            // Поиск регистрационной записи, для текущей игры рассматриваемой команды
            const registerGame = await db.RegisterCommands.findOne({
                where: {
                    info_games_id: commandItem.info_games_id,
                    commands_id: commandItem.commands_id
                }
            });

            // Поиск всех игр команды по текущей игре
            const games = await db.Games.findAll({
                where: {
                    register_commands_id: registerGame.id,
                }
            });

            // Все квесты данной игры для данной команды
            const gameQuests = await db.GamesQuests.findAll({
                where: {
                    info_games_id: commandItem.info_games_id
                }
            });

            // Определение всех заданий для текущей игры и текущей команды, которые были пройдены
            const finisheds = await db.FinishedGames.findAll({
                where: {
                    games_id: {
                        [db.Sequelize.Op.in]: games.map((item) => item.id)
                    }
                }
            });

            const gamesFinished = [];

            // Отсеивание тех игр для текущей игры, которые были пройдены
            await games.removeIfAsync(async (item) => {
                let flag = false;

                for (let i = 0; (i < finisheds.length) && (!flag); i++) {
                    if (finisheds[i].games_id == item.id) {
                        flag = true;
                        gamesFinished.push(item);
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
                    id: commandItem.info_games_id
                }
            });

            // Проверка даты текущей игры, если дата завершения 
            // игры меньше либо равна текущей дате, то игра считается пройденной
            // и игра завершается
            if ((new Date(infoGames.date_end)) <= (new Date())) {
                const completeGames = await db.CompleteGames.findOne({
                    where: {
                        info_games_id: commandItem.info_games_id
                    }
                });

                const currentGames = await db.CurrentGames.findOne({
                    where: {
                        info_games_id: commandItem.info_games_id,
                        commands_id: commandItem.commands_id
                    }
                });

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
                        commands_id: commandItem.commands_id,
                        info_games_id: commandItem.info_games_id,
                        completed: false,
                        current_score: score,
                    }, { transaction: t });

                    // Удаление судъи из списка (не удаляется, т.к. необходимо сохранять ссылку на судью)
                    // ########################### [comment='judge-begin']
                    /*const fixJudges = await FixJudges.findOne({
                        commands_id: currentGames.commands_id,
                        info_games_id: currentGames.info_games_id
                    });

                    await fixJudges.destroy();*/
                    // ########################### [comment-end='judge-begin']

                    // Удаление текущей игры
                    await currentGames.destroy({ transaction: t });
                } else {
                    // Обновляем статус игры на не пройденную
                    if (!completeGames.completed) {
                        await completeGames.update({
                            completed: false
                        }, { transaction: t });
                    }

                    // ########################### [comment='judge-begin']
                    /*const fixJudges = await FixJudges.findOne({
                        commands_id: currentGames.commands_id,
                        info_games_id: currentGames.info_games_id
                    });

                    await fixJudges.destroy();*/
                    // ########################### [comment-end='judge-begin']
                    await currentGames.destroy({ transaction: t });
                }

                // Отправка сообщения о завершении игры
                // всем игрокам, которые находятся в сети
                // для данной команды
                io.to(commandItem.commands_id).emit("game_over");
            }

            if (games.length === 0) {
                // Если нет текущей игры, то инициируется попытка её создания
                if (gameQuests.length === 0) {
                    // Если все квесты были пройдены, то вся игра была успешно пройдена
                    const currentGames = await db.CurrentGames.findOne({
                        where: {
                            info_games_id: commandItem.info_games_id,
                            commands_id: commandItem.commands_id
                        }
                    });

                    const completeGames = await db.CompleteGames.findOne({
                        where: {
                            info_games_id: commandItem.info_games_id
                        }
                    });

                    if (!completeGames) {
                        await db.CompleteGames.create({
                            commands_id: commandItem.commands_id,
                            info_games_id: commandItem.info_games_id,
                            completed: true,
                            current_score: 10,
                        }, { transaction: t });

                        await currentGames.destroy({ transaction: t });
                    } else {
                        // Обновляем статус игры на пройденную
                        if (!completeGames.completed) {
                            await completeGames.update({
                                completed: true
                            }, { transaction: t });
                        }

                        await currentGames.destroy({ transaction: t });
                    }

                    io.to(commandItem.commands_id).emit("game_over");
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
                        commands_id: commandItem.commands_id,
                        register_commands_id: registerGame.id,
                        quests_id: newQuest.id
                    }, { transaction: t });

                    // Нужно повторно запросить свой статус у каждого члена команды
                    repeatStatusRequest.push(commandItem.commands_id);
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

                if (currentGame) {
                    // Определение текущего квеста по заданию
                    const currentQuest = await db.Quests.findOne({
                        where: {
                            id: currentGame.quests_id
                        },
                        include: {
                            model: db.Marks
                        }
                    });

                    // Для дальнейшего шага необходимо выполнение условия "имеется текущее задание и оно ещё не видимо"
                    if (!currentGame.view) {
                        // Определение игроков в текущей команде
                        const dataPlayers = await db.DataPlayers.findAll({
                            where: {
                                commands_id: commandItem.commands_id
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
                                    }, { transaction: t });

                                    // После того, как метка была найдена из всех игроков в команде выбирается тот,
                                    // кто будет вести съёмку видео, которое будет отправлено на сервер в качестве
                                    // результата действий игроков (ответ на медиафайл квеста)


                                    // const playerIndex = getRandomInt(0, (dataPlayers.length - 1));

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
                                            data_players_id: command.users_id // dataPlayers[playerIndex].id
                                        }, { transaction: t });
                                    }

                                    // Выходим из цикла, т.к. теперь текущее задание видно и можно
                                    // не сравнивать координаты всех меток с координатами игроков
                                    break;
                                }
                            }
                        }
                    } else {
                        io.to(commandItem.commands_id).emit(
                            "set_view_current_quest",
                            JSON.stringify({
                                games_id: currentGame.dataValues.id,
                                radius: currentQuest.dataValues.radius,
                                lat: currentQuest.dataValues.mark.lat,
                                lng: currentQuest.dataValues.mark.lng
                            })
                        );

                        io.to(commandItem.commands_id).emit(
                            "set_view_current_action",
                            JSON.stringify({
                                games_id: currentGame.dataValues.id,
                                action: currentQuest.dataValues.action
                            })
                        );

                        // Визуализация элемента для записи видео
                        const teamLeadIndex = duGetIndexById(dataUsers, command.users_id);

                        if (teamLeadIndex >= 0) {
                            io.to(dataUsers[teamLeadIndex].socket_id).emit("set_video_team_lead");
                        }
                    }
                }
            }
        }

        await t.commit();

        // Повторный запрос статуса в командах, в которых был добавлен новый квест
        if (repeatStatusRequest.length > 0) {
            for (let i = 0; i < repeatStatusRequest.length; i++) {
                io.to(repeatStatusRequest[i]).emit("repeat_status_request");
            }
        }
    } catch (e) {
        await t.rollback();
        console.log(e);
    }

    lockGlobal = false;
}, 2000);
