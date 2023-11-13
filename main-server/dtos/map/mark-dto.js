/**
* @typedef MarkDto
* @property {number} id
* @property {number} lat
* @property {number} lng
* @property {string} location
* @property {string} created_at
* @property {string} updated_at
* @property {number} users_id
*/
class MarkDto {
    id;
    lat;
    lng;
    location;
    created_at;
    updated_at;
    users_id;

    constructor(model) {
        for (const key in model) {
            this[key] = model[key];
        }
    }
}

export default MarkDto;