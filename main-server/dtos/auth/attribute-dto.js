/**
 * @typedef AttributeDto
 * @property {boolean} read
 * @property {boolean} write
 * @property {boolean} update
 * @property {boolean} delete
 */
class AttributeDto {
    read;
    write;
    update;
    delete;

    constructor(model) {
        for (const key in model) {
            this[key] = model[key];
        }
    }
}

export default AttributeDto;