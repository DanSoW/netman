package com.main.netman.constants.socket

object SocketHandlerConstants {
    const val AUTH = "authentication"
    const val AUTH_FAILED = "authentication_failed"
    const val AUTH_SUCCESS = "authentication_success"

    const val STATUS = "status"
    const val STATUS_ON = "status_on"

    const val COMMAND_STATUS = "command_status"
    const val COMMAND_STATUS_ON = "command_status_on"

    const val SET_CURRENT_COORDINATES = "set_current_coordinates"
    const val GET_PLAYER_COORDINATES = "get_player_coordinates"
    const val SET_PLAYER_COORDINATES = "set_player_coordinates"
    const val CLEAR_GAMES_MARKS = "clear_games_marks"

    const val ADD_PLAYER_COORDINATES = "add_player_coordinates"
    const val COORDINATES_PLAYERS = "coordinates_players"

    const val TEAM_PLAYER_DISCONNECT = "team_player_disconnect"
}