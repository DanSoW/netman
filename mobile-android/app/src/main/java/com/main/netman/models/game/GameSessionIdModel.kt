package com.main.netman.models.game

import com.google.gson.annotations.SerializedName

data class GameSessionModel(
    @SerializedName("session_id") var sessionId: String? = null
)
