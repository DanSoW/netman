import ModuleDto from "./module-dto.js";
import AttributeDto from "./attribute-dto.js";

/**
 * @typedef AuthDto
 * @property {string} access_token - Токен доступа
 * @property {string} refresh_token - Токен обновления
 * @property {number} type_auth - Тип авторизации пользователя
 * @property {ModuleDto.model} refresh_token - Доступные модули
 * @property {AttributeDto.model} attributes - Атрибуты пользователя
 */
class AuthDto {
    refresh_token
    access_token;
    type_auth;
    modules;
    attributes;

    constructor(model) {
        for (const key in model) {
            this[key] = model[key];
        }
    }
}

export default AuthDto;
