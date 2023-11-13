/**
 * @typedef ActivationLinkDto
 * @property {string} activation_link
 */
class ActivationLinkDto {
    activation_link;

    constructor(model) {
        for (const key in model) {
            this[key] = model[key];
        }
    }
}

export default ActivationLinkDto;