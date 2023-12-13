import ApiError from '../exceptions/api-error.js';
import tokenService from '../services/token/token-service.js';
import db from '../db/index.js';
import oauthService from '../services/token/oauth-service.js';
import jwtService from '../services/token/jwt-service.js';
import CookieKeys from '../constants/values/cookie-keys.js';
import jwt from 'jsonwebtoken';

/**
 * Middleware для проверки авторизационных данных пользователя
 * @param {*} req Запрос от пользователя 
 * @param {*} res Ответ пользователю
 * @param {*} next 
 * @returns 
 */
const authMiddleware = async function (req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization;

        if (!authorizationHeader) {
            return next(ApiError.UnathorizedError());
        }

        const authData = authorizationHeader.split(' ');
        const accessToken = authData[1];

        if ((!accessToken) || (authData.length != 2)) {
            return next(ApiError.UnathorizedError());
        }

        const userData = jwtService.validateAccessToken(accessToken);
        /*switch (Number(authData[1])) {
            case 0: {
                // Авторизация с помощью сервиса NetMan (обычная авторизация)
                userData = jwtService.validateAccessToken(accessToken);
                break;
            }

            case 1: {
                // Авторизация с помощью сервиса Google OAuth2
                userData = await oauthService.validateAccessToken(accessToken);
                const candidat = await db.Users.findOne({
                    where: {
                        email: userData.email
                    }
                });
                userData.users_id = candidat.id;

                break;
            }
        }*/

        // Поиск токена доступа по определённому ID пользователя (для предотвращения подделки токенов доступа)
        const findToken = await tokenService.findTokenByAccessToken(userData.users_id, accessToken);

        if ((!userData) || (!findToken)) {
            return next(ApiError.UnathorizedError());
        }

        const refreshToken = req.cookies[CookieKeys.refreshToken];

        if (!refreshToken) {
            // return next(ApiError.UnathorizedError());
        }

        const user = await db.Users.findOne({ where: { id: userData.users_id } });

        if (!user) {
            return next(ApiError.NotFound("Пользователя с данным идентификатором не найдено"));
        }

        // Встраивание дополнительных полей в тело запроса
        req.body.users_id = userData.users_id;
        req.body.type_auth = userData.type_auth;
        req.body.refresh_token = findToken.refresh_token;
        
        next();
    } catch (e) {
        return next(ApiError.UnathorizedError());
    }
};

export default authMiddleware;
