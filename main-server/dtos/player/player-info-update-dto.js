/**
 * @typedef PlayerInfoUpdateDto
 * @property {string} old_email.required
 * @property {string} new_email.required
 * @property {string} name.required
 * @property {string} surname.required
 * @property {string} nickname.required
 * @property {string} phone_num.required
 * @property {string} location.required
 * @property {string} date_birthday.required
 */
class PlayerInfoUpdateDto{
    users_id;
    old_email;
    new_email;
    name;
    surname;
    nickname;
    phone_num;
    location;
    date_birthday;

    constructor(model){
        for(const key in model){
            this[key] = model[key];
        }
    }
}

export default PlayerInfoUpdateDto;