//-----------------------------------------------------------------------------------------
// Маршрутизация для загрузки и скачивания медиафайлов
//-----------------------------------------------------------------------------------------

const { Router } = require('express');
const router = Router();                    //маршрутизация
const logger = require('../logger/logger'); //логгер
const fetch = require('node-fetch');
const config = require("config");           //подключение конфига
const { address_config }
    = require('../config/address.config');  //константы маршрутов

// Импорт библиотеки Multer
const multer = require("multer");
// Импорти библиотеки для генерации uuid
const {
    v4: uuidv4,
} = require('uuid');

// Конфигурирование файлового хранилища multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Определение файлового хранилища
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.');
        const extFile = ext[ext.length - 1];

        // Сохранение файла с расширением
        cb(null, `${uuidv4()}.${extFile}`);
    }
});
const upload = multer({ storage: storage });
const fs = require("fs");
const {
    MediaResults, MediaInstructions, sequelize, Sequelize, MediaFiles
} = require('../sequelize/models');

router.post(address_config.m_download_stats_instructions, async function (req, res) {
    try {
        const {
            users_id,
            access_token
        } = req.body;

        // проверка пользователей, токенов...

        const allMediaInstructions = await MediaInstructions.findAll();
        const statsMediaInstructions = [];

        for (let i = 0; i < allMediaInstructions.length; i++) {
            if (fs.existsSync(allMediaInstructions[i].dataValues.local_path)) {
                const stats = fs.statSync(allMediaInstructions[i].dataValues.local_path);
                statsMediaInstructions.push({
                    name_file: allMediaInstructions[i].dataValues.name_file,
                    date_created: allMediaInstructions[i].dataValues.date_created,
                    size_mb: Math.round(stats["size"] / (1024 * 1024)),
                    local_path: allMediaInstructions[i].dataValues.local_path
                });
            }
        }

        return res.status(201).json({
            stats: statsMediaInstructions
        });
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            errors: null,
            message: "Файла не найдено!"
        });
    }
});

router.get(address_config.m_download_name, async function (req, res) {
    try {
        const name = req.params.name;
        if (!name) {
            return res.status(404).json({
                errors: null,
                message: "Файла не найдено!"
            });
        }

        const mediaInstructions = await MediaInstructions.findOne({
            where: {
                name_file: name
            }
        });

        if (!mediaInstructions) {
            return res.status(404).json({
                errors: null,
                message: "Файла не найдено!"
            });
        }

        const stats = fs.statSync(mediaInstructions.local_path);

        return res.status(201)
            .set({
                "filename": mediaInstructions.name_file
            })
            .download(mediaInstructions.local_path, mediaInstructions.name_file);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            errors: null,
            message: "Файла не найдено!"
        });
    }
});

router.post(address_config.m_upload, upload.single("file"), async function (req, res) {
    try {
        const {
            current_games,
            users_id,
            games_id,
            ref_media_instructions,
            access_token
        } = JSON.parse(req.body.video_data); // Данные о видео

        // Проверка токена ...

        let filedata = req.file;

        if (!filedata) {
            return res.status(201).json({
                message: "Видео не загружено!"
            });
        }
        else {
            const mediaInstructions = await MediaInstructions.findOne({
                where: {
                    local_path: ref_media_instructions
                }
            });

            const localPathResults = await MediaResults.create({
                current_games: current_games,
                users_id: users_id,
                games_id: games_id,
                media_instructions_id: mediaInstructions.id,
                name_file: filedata.filename,
                local_path: filedata.path
            });

            return res.status(201).json({
                errors: null,
                message: null,
                local_path: localPathResults.local_path
            });
        }
    } catch (e) {
        console.log(e);
    }
});

router.post(address_config.m_download, async function (req, res) {
    try {
        const {
            local_path,
            access_token
        } = req.body;

        // Проверка токена ...

        const mediaFile = await MediaResults.findOne({
            where: {
                local_path: local_path
            }
        });

        if (!mediaFile) {
            return res.status(404).json({
                errors: null,
                message: "Файла не найдено!"
            });
        }

        res.status(201)
            .set({
                "filename": mediaFile.name_file
            })
            .download(mediaFile.local_path, mediaFile.name_file);
    } catch (e) {
        console.log(e);
    }
});

router.post(address_config.m_instructions_download, async function (req, res) {
    try {
        const {
            local_path,
            access_token
        } = req.body;

        // Проверка токена ...

        const mediaFile = await MediaInstructions.findOne({
            where: {
                local_path: local_path
            }
        });

        if (!mediaFile) {
            return res.status(404).json({
                errors: null,
                message: "Файла не найдено!"
            });
        }

        res.status(201)
            .set({
                "filename": mediaFile.name_file
            })
            .download(mediaFile.local_path, mediaFile.name_file);
    } catch (e) {
        console.log(e);
    }
});

// Обработка маршрута с предварительной загрузкой файла
router.post(address_config.f_upload, upload.single("file"), async function (req, res) {
    try {
        let filedata = req.file;

        if (!filedata) {
            return res.status(201).json({
                message: "Файл не загружен!"
            });
        }
        else {
            // Определение расширения файла
            const ext = filedata.originalname.split('.');
            const extFile = ext[ext.length - 1];

            // Создание записи в таблице о загруженном файле
            const mediaFile = await MediaFiles.create({
                name_file: filedata.originalname.split('.')[0],
                ext: extFile,
                type: "img",
                local_path: filedata.path
            });

            return res.status(201).json({
                errors: null,
                message: null,
                local_path: filedata.path
            });
        }
    } catch (e) {
        console.log(e);
    }
});

// Обработка маршрута
router.post(address_config.f_download, async function (req, res) {
    try {
        // Получение идентификатора файла из тела запроса
        const {
            media_files_id
        } = req.body;

        // Поиск файла в базе данных
        const mediaFile = await MediaFiles.findOne({
            where: {
                id: media_files_id
            }
        });

        // Проверка загружен файл или нет
        if (!mediaFile) {
            return res.status(201).json({
                message: "Файл не загружен!"
            });
        }

        // Возвращение ссылки на файл
        return res.status(201).json({
            errors: null,
            message: null,
            path: `http://localhost:5001/${mediaFile.local_path}`
        });
    } catch (e) {
        console.log(e);
    }
});

module.exports = router;