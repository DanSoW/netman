export const creator_default_route = '/creator';

const CreatorRoutesConstants = {
    creator: creator_default_route,

    // Games routes
    games_add: `${creator_default_route}/games/add`,
    games_view_created: `${creator_default_route}/games/view/created`,
    games_archive: `${creator_default_route}/games/archive`,
    game_view: `${creator_default_route}/games/view`,
};

export default CreatorRoutesConstants;