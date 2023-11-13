/**
 * @typedef RefreshDto
 * @property {string} refresh_token.required
 * @property {number} type_auth.required
 */
class RefreshDto {
    refresh_token;
    type_auth;

    constructor(model) {
        for (const key in model) {
            this[key] = model[key];
        }
    }
}

export default RefreshDto;