import ContextInfoDto from "../base/context-info-dto.js";

/**
 * @typedef SetResultGameDto
 * @property {string} type_result.required
 * @property {number} exec_quests_id.required
 */
class SetResultGameDto extends ContextInfoDto {
    type_result;
    exec_quests_id;

    constructor(model) {
        super(model);

        this.title = String(model.title).trim();
        this.location = String(model.location).trim();
        this.quests = model.quests;
    }
}

export default SetResultGameDto;