export const moderator_default_route = '/moderator';

const ModeratorRoutesConstants = {
    moderator: moderator_default_route,

    creators_list: `${moderator_default_route}creators/list`,
    creator_info: `${moderator_default_route}/creator/info`,
    game_moderation: `${moderator_default_route}/game/moderation`,
};

export default ModeratorRoutesConstants;