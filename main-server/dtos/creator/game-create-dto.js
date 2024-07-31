import QuestDto from "./quest-dto.js";

/**
 * @typedef GameCreateDto
 * @property {string} title.required
 * @property {string} location.required
 * @property {Array.<QuestDto>} quests.required
 */
class GameCreateDto {
    title;
    location;
    quests;
    users_id;

    constructor(model) {
        this.title = model.title;
        this.location = model.location;
        this.quests = model.quests;
        this.users_id = model.users_id;
    }
}

export default GameCreateDto;