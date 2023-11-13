package com.main.netman.models.auth

import com.google.gson.annotations.SerializedName

data class AuthModel(
    @SerializedName("access_token") var accessToken: String? = null,
    @SerializedName("refresh_token") var refreshToken: String? = null,
    @SerializedName("type_auth") var typeAuth: Int? = null,
    @SerializedName("modules") var modules: ModulesModel? = ModulesModel(),
    @SerializedName("attributes") var attributes: AttributesModel? = AttributesModel()
)
