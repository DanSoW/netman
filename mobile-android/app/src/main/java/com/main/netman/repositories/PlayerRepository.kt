package com.main.netman.repositories

import com.google.gson.Gson
import com.main.netman.models.command.TeamCreateModel
import com.main.netman.models.user.UserInfoUpdateModel
import com.main.netman.network.apis.PlayerApi
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class PlayerRepository(
    private val api: PlayerApi
) : BaseRepository() {

    /**
     * Получение информации о пользователе
     */
    suspend fun playerInfo() = safeApiCall {
        api.playerInfo()
    }

    /**
     * Получение информации о изображении пользователя
     */
    suspend fun playerInfoImg() = safeApiCall {
        api.playerInfoImg()
    }

    /**
     * Обновление информации о пользователях
     */
    suspend fun playerInfoUpdate(body: UserInfoUpdateModel) = safeApiCall {
        val requestBody = Gson().toJson(body).toRequestBody("application/json".toMediaTypeOrNull())

        api.playerInfoUpdate(requestBody)
    }

    /**
     * Загрузка информации о новом изображении пользователя
     */
    suspend fun playerInfoImgUpdate(filepath: String) = safeApiCall {
        // Получение информации о файле
        val file = File(filepath)

        // Создание части запроса для файла
        val requestFile = RequestBody.create("multipart/form-data".toMediaTypeOrNull(), file)

        // Добавление данных о файле
        val body: MultipartBody.Part =
            MultipartBody.Part.createFormData("file", file.name, requestFile)

        api.playerInfoImgUpdate(body)
    }

    /**
     * Создание новой команды
     */
    suspend fun playerCommandCreate(body: TeamCreateModel) = safeApiCall {
        val requestBody = Gson().toJson(body).toRequestBody("application/json".toMediaTypeOrNull())

        api.playerCommandCreate(requestBody)
    }
}