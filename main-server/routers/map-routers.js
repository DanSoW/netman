import { Router } from 'express';
import { check } from 'express-validator';
import authMiddleware from '../middlewares/auth-middleware.js';
import GeocoderValuesDto from '../dtos/geocoder/geocoder-values-dto.js';
import GeocoderAddressDto from '../dtos/geocoder/geocoder-address-dto.js';
import MapRoute from '../constants/routes/map.js';
import mapController from '../controllers/map-controller.js';
import MarkDto from '../dtos/map/mark-dto.js';
import MarkCreateDto from '../dtos/map/mark-create-dto.js';

const router = new Router();

/**
 * Создание новой метки на карте
 * @route POST /map/mark/create
 * @group Карты - Функции для работы с картами
 * @operationId mapMarkCreate
 * @param {MarkCreateDto.model} input.body.required Входные данные
 * @returns {MarkCreateDto.model} 200 - Выходные данные
 * @returns {ApiError.model} default - Ошибка запроса
 * @security JWT
 */
router.post(
    MapRoute.markCreate,
    [
        authMiddleware,
        check('users_id', 'Некорректный идентификатор пользователя').isInt({ min: 1}),
        check('lat', 'Значение latitude должно быть вещественным').isFloat(),
        check('lng', 'Значение longtitude должно быть вещественным').isFloat()
        
    ],
    mapController.markCreate
);

/**
 * Получение всех меток
 * @route GET /map/marks
 * @group Карты - Функции для работы с картами
 * @operationId mapMarks
 * @returns {MarkDto.model} 200 - Выходные данные
 * @returns {ApiError.model} default - Ошибка запроса
 * @security JWT
 */
router.get(
    MapRoute.marks,
    [
        authMiddleware,
        check('users_id', 'Некорректный идентификатор пользователя').isInt({ min: 1})
    ],
    mapController.marks
);

/**
 * Получение всех свободных меток
 * @route GET /map/marks/free
 * @group Карты - Функции для работы с картами
 * @operationId mapMarksFree
 * @returns {MarkDto.model} 200 - Выходные данные
 * @returns {ApiError.model} default - Ошибка запроса
 * @security JWT
 */
router.get(
    MapRoute.marksFree,
    [
        authMiddleware,
        check('users_id', 'Некорректный идентификатор пользователя').isInt({ min: 1})
    ],
    mapController.marksFree
);

export default router;