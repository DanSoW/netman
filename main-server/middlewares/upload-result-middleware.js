import ApiError from '../exceptions/api-error.js';
import { isUndefinedOrNull } from '../utils/objector.js';

import { v4 as uuid } from 'uuid';
import multer from 'multer';
import SetResultGameDto from '../dtos/player/set-result-game-dto.js';

// Конфигурирование файлового хранилища multer
const storageImages = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("file: ", new SetResultGameDto(JSON.parse(JSON.stringify(req.body))));
        cb(null, './public/images/');
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.');
        const extFile = ext[ext.length - 1];

        cb(null, `${uuid()}.${extFile}`);
    }
});

const storageVideos = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/videos/');
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.');
        const extFile = ext[ext.length - 1];

        cb(null, `${uuid()}.${extFile}`);
    }
});

const uploadImages = multer({ storage: storageImages });
const uploadVideos = multer({ storage: storageVideos });

/**
 * Middleware для проверки авторизационных данных пользователя
 * @param {*} req Запрос от пользователя 
 * @param {*} res Ответ пользователю
 * @param {*} next 
 * @returns 
 */
const uploadResultMiddleware = async function (req, res, next) {
    try {
        return uploadImages.single("file")(req, res, next);

        const attr = req?.body?.type_result || null;
        const attrExits = !isUndefinedOrNull(attr);
        
        console.log(req.get("type_result"));

        if(!attrExits) {
            return next(ApiError.BadRequest("Не верный тип результата"));
        }

        if(attr === "image") {
            return uploadImages.single("file")(req, res, next);
        } else if(attr === "video") {
            return uploadVideos.single("file")(req, res, next);
        }

        return next(ApiError.BadRequest("Не верный тип результата"));
    } catch (e) {
        return next(ApiError.UnathorizedError());
    }
};

export default uploadResultMiddleware;
