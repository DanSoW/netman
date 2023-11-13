package com.main.netman.constants.network.player

object PlayerApiConstants {
    private const val BASE = "/player"
    const val PLAYER_INFO = "${BASE}/info"
    const val PLAYER_INFO_UPDATE = "${BASE}/info/update"
    const val PLAYER_INFO_IMG = "${BASE}/info/img"
    const val PLAYER_INFO_IMG_UPDATE = "${BASE}/info/img/update"
    const val PLAYER_COMMAND_CREATE = "${BASE}/command/create"
    const val PLAYER_COMMANDS_LIST = "${BASE}/commands/list"
}