/**
 * @typedef UsersIdDto
 * @property {number} users_id.required
 */
class UsersIdDto {
    users_id;

    constructor(model){
        this.users_id = model.users_id;
    }
}

export default UsersIdDto;