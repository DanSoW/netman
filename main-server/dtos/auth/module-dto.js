/**
 * @typedef ModuleDto
 * @property {boolean} player
 * @property {boolean} judge
 * @property {boolean} creator
 * @property {boolean} moderator
 * @property {boolean} manager
 * @property {boolean} admin
 * @property {boolean} super_admin
 */
class ModuleDto {
    player;
    judge;
    creator;
    moderator;
    manager;
    admin;
    super_admin;

    constructor(model) {
        for (const key in model) {
            this[key] = model[key];
        }
    }
}

export default ModuleDto;