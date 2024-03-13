//**********************************************************************
// Конфигурационный файл содержащий пути для взаимодействия с сервером
//**********************************************************************

const address_config = {
    security_access: '/security/access',
    auth_register: '/auth/register',
    auth_login: '/auth/management/sign-in',
    auth_oauth: '/auth/management/oauth',
    auth_logout: '/auth/management/logout',
    auth_refresh_token: '/auth/refresh/token',
    map_marks_free: '/map/marks/free',
    map_mark_create: '/map/mark/create',
    map_geocoder_address: '/map/geocoder/address',

    // Функции создателя
    function_creator_games_add: '/creator/game/create',
    function_creator_games_created: '/creator/games/created',
    function_creator_games_delete: '/creator/game/delete',

    // Функции модератора
    function_moderator_games_queue: '/moderator/queue/games',
    function_moderator_creator_info: "/moderator/creator/info",
    function_moderator_game_info: '/moderator/game/info',
    function_moderator_game_accepted: '/moderator/game/accepted',
    function_moderator_games_checked: "/moderator/games/checked",
    function_moderator_creators_list: "/moderator/creators/list",
    function_moderator_game_warning: '/moderator/game/warning',
    function_moderator_game_ban: '/moderator/game/ban',
    function_moderator_game_unban: '/moderator/game/unban',

    // Функции игрока
    function_player_games: '/player/games',
    function_player_info: '/player/info',
    function_player_info_update: '/player/info/update',
    function_player_statistics: '/player/statistics',
    function_player_command: '/player/command',

    // Общие функции взаимодействия с медиа сервером
    get_stats_instructions: '/media/download/stats/instructions',
    instructions_download: '/media/download/',
};

export default address_config;