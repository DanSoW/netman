/**
 * @typedef MarkCreateDto
 * @property {number} lat.required
 * @property {number} lng.required
 * @property {string} location.required
 */
class MarkCreateDto {
    users_id;
    lat;
    lng;
    location;

    constructor(model) {
        for (const key in model) {
            this[key] = model[key];
        }
    }
}

export default MarkCreateDto;