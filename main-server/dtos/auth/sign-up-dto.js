/**
 * @typedef SignUpDto
 * @property {string} email.required
 * @property {string} password.required
 * @property {string} phone_num.required
 * @property {string} location.required
 * @property {string} date_birthday.required
 * @property {string} nickname.required
 * @property {string} name.required
 * @property {string} surname.required
 */
class SignUpDto {
    email;
    password;
    phone_num;
    location;
    date_birthday;
    nickname;
    name;
    surname;

    constructor(model) {
        for (const key in model) {
            this[key] = model[key];
        }
    }
}

export default SignUpDto;