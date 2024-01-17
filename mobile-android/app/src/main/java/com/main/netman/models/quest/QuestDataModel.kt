package com.main.netman.models.quest

import com.google.gson.annotations.SerializedName

data class QuestDataModel(
    @SerializedName("radius") var radius: Double? = null,
    @SerializedName("lat") var lat: Double? = null,
    @SerializedName("lng") var lng: Double? = null
)
