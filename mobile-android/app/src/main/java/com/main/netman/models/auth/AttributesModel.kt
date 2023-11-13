package com.main.netman.models.auth

import com.google.gson.annotations.SerializedName

data class AttributesModel(
    @SerializedName("read"   ) var read   : Boolean? = null,
    @SerializedName("write"  ) var write  : Boolean? = null,
    @SerializedName("update" ) var update : Boolean? = null,
    @SerializedName("delete" ) var delete : Boolean? = null
)
