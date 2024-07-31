package com.main.netman.containers.game.models

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.main.netman.containers.base.BaseViewModel
import com.main.netman.models.game.GameSessionIdModel
import com.main.netman.network.Resource
import com.main.netman.repositories.PlayerRepository
import kotlinx.coroutines.launch
import okhttp3.ResponseBody
import retrofit2.Response

class GameViewModel(
    private val repository: PlayerRepository
) : BaseViewModel(repository) {
    private val _gameInfo: MutableLiveData<Resource<Response<ResponseBody>>> =
        MutableLiveData()
    val gameInfo: LiveData<Resource<Response<ResponseBody>>>
        get() = _gameInfo

    /**
     * Получение информации о текущей игре
     */
    fun gameInfo() = viewModelScope.launch {
        _gameInfo.value = Resource.Loading
        _gameInfo.value = repository.playerGameInfo()
    }

    private val _detachGame: MutableLiveData<Resource<Response<ResponseBody>>> =
        MutableLiveData()
    val detachGame: LiveData<Resource<Response<ResponseBody>>>
        get() = _detachGame

    /**
     * Выход пользователя из игры
     */
    fun detachGame(sessionId: GameSessionIdModel) = viewModelScope.launch {
        _detachGame.value = Resource.Loading
        _detachGame.value = repository.playerDetachGame(sessionId)
    }
}