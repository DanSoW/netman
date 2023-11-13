package com.main.netman.models.command

import com.google.gson.annotations.SerializedName

data class CommandInfoModel (
    @SerializedName("name") var name: String? = null,
    @SerializedName("count_members") var countMembers: Int? = null,
)