
/**
 * @typedef MarkAddInfoDto
 * @property {number} title - Название метки
 * @property {number} description - Описание метки
 * @property {number} lat - Координата lat метки
 * @property {number} lng - Координата lng метки
 */
class MarkAddInfoDto {
    users_id;
    title;
    description;
    lat;
    lng;

    constructor(model) {
        for (const key in model) {
            this[key] = model[key];
        }
    }
}

export default MarkAddInfoDto;