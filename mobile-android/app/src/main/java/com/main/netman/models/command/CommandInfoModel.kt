package com.main.netman.models.command

import com.google.gson.annotations.SerializedName

data class CommandInfoModel (
    @SerializedName("name") var name: String? = null,
    @SerializedName("score") var score: Int? = null,
)