export const PlayerRouteBase = "/player";

const PlayerRoute = {
    games: '/games',
    info: '/info',
    infoUpdate: '/info/update',
    infoImg: '/info/img',
    infoImgUpdate: '/info/img/update',
    statistics: '/statistics',
    command: '/command',
    commandPlayers: '/command/players',
    commandCurrentGame: '/command/current/game',
    commandGames: '/command/games',
    gameStatus: '/game/status',
    commandsList: '/commands/list',
    commandJoin: '/command/join',
    commandDetach: '/command/detach',
    commandCreate: '/command/create',
    commandRegisterGame: '/command/register/game',
    commandAvailableGames: '/command/available/games',
    commandFreeListTag: '/command/free/list/tag',
    commandJoinCertain: '/command/join/certain',
    findCertain: '/find/certain',
    commandCurrentMediaInstructions: '/command/current/media/instructions',
    commandAddResult: '/command/add/result',
    judgeGetInfo: '/judge/get/info',
    judgeSetScore: '/judge/set/score',
};

export default PlayerRoute;