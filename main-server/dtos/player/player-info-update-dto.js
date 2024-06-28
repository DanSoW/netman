/**
 * @typedef PlayerInfoUpdateDto
 * @property {string} email.required
 * @property {string} nickname.required
 */
class PlayerInfoUpdateDto{
    email;
    nickname;

    constructor(model){
        this.email = model.email;
        this.nickname = model.nickname;
    }
}

export default PlayerInfoUpdateDto;