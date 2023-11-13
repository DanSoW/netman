package com.main.netman.network.handlers

import android.util.Log
import com.main.netman.constants.network.main.MainNetworkConstants
import io.socket.client.IO
import io.socket.client.Socket

/**
 * Описание глобального объекта для работы с сокетом,
 * который взаимодействует с основным сервером
 */
object SCSocketHandler {
    private var mSocket: Socket? = null

    // Идентификатор авторизации пользователя в рамках системы
    private var auth: Boolean = false

    @Synchronized
    fun setSocket(){
        try{
            mSocket = IO.socket(MainNetworkConstants.MAIN_API)
        }catch (e: Exception) {
            Log.e("SOCKET", e.message.toString())
        }
    }

    @Synchronized
    fun getSocket(): Socket? {
        return mSocket
    }

    @Synchronized
    fun connection() {
        mSocket?.connect()
    }

    @Synchronized
    fun disconnection() {
        mSocket?.disconnect()
    }

    @Synchronized
    fun setAuth(auth: Boolean) {
        this.auth = auth
    }

    @Synchronized
    fun getAuth(): Boolean {
        return auth
    }

}