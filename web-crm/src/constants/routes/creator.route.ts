export const CREATOR_ROUTE_DEFAULT = "/creator";

const CreatorRoute = {
  BASE: `${CREATOR_ROUTE_DEFAULT}`,
  CREATE_GAME: `${CREATOR_ROUTE_DEFAULT}/create/game`,
  EDIT_GAME: `${CREATOR_ROUTE_DEFAULT}/edit/game/:id`,
  GAME_LIST: `${CREATOR_ROUTE_DEFAULT}/game/list`
};

export default CreatorRoute;
