export const moderator_default_api = "/function/moderator";

const ModeratorApiConstants = {
    games_queue: `${moderator_default_api}/games/queue`,
    creator_info: `${moderator_default_api}/creator/info`,
    game_info: `${moderator_default_api}/game/info`,
    game_accepted: `${moderator_default_api}/game/accepted`,
    games_checked: `${moderator_default_api}/games/checked`,
    creators_list: `${moderator_default_api}/creators/list`,
    game_warning: `${moderator_default_api}/game/warning`,
    game_ban: `${moderator_default_api}/game/ban`,
    game_unban: `${moderator_default_api}/game/unban`,
}

export default ModeratorApiConstants;