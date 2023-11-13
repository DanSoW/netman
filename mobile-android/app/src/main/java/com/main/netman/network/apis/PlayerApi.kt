package com.main.netman.network.apis

import com.main.netman.constants.network.creator.CreatorApiConstants
import com.main.netman.constants.network.player.PlayerApiConstants
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

/**
 * Интерфейс предоставляющий API-запросы для функционального модуля "Игрок"
 */
interface PlayerApi {
    /**
     * Получение информации о пользователе
     */
    @GET(PlayerApiConstants.PLAYER_INFO)
    suspend fun playerInfo(): Response<ResponseBody>

    /**
     * Обновление информации о пользователе
     */
    @POST(PlayerApiConstants.PLAYER_INFO_UPDATE)
    suspend fun playerInfoUpdate(@Body requestBody: RequestBody): Response<ResponseBody>

    /**
     * Получение ссылки на изображение пользователя
     */
    @GET(PlayerApiConstants.PLAYER_INFO_IMG)
    suspend fun playerInfoImg(): Response<ResponseBody>

    /**
     * Добавление информации о изображении пользователя
     */
    @Multipart
    @POST(PlayerApiConstants.PLAYER_INFO_IMG_UPDATE)
    suspend fun playerInfoImgUpdate(@Part file: MultipartBody.Part): Response<ResponseBody>

    /**
     * Создание новой команды
     */
    @POST(PlayerApiConstants.PLAYER_COMMAND_CREATE)
    suspend fun playerCommandCreate(@Body requestBody: RequestBody): Response<ResponseBody>
}