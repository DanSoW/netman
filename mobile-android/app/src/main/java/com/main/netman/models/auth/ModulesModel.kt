package com.main.netman.models.auth

import com.google.gson.annotations.SerializedName

data class ModulesModel(
    @SerializedName("player"      ) var player     : Boolean? = null,
    @SerializedName("judge"       ) var judge      : Boolean? = null,
    @SerializedName("creator"     ) var creator    : Boolean? = null,
    @SerializedName("moderator"   ) var moderator  : Boolean? = null,
    @SerializedName("manager"     ) var manager    : Boolean? = null,
    @SerializedName("admin"       ) var admin      : Boolean? = null,
    @SerializedName("super_admin" ) var superAdmin : Boolean? = null
)
