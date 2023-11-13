package com.main.netman.containers.game.models

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.main.netman.containers.base.BaseViewModel
import com.main.netman.models.command.CommandStatusModel
import com.main.netman.models.command.TeamCreateModel
import com.main.netman.network.Resource
import com.main.netman.repositories.PlayerRepository
import kotlinx.coroutines.launch
import okhttp3.ResponseBody
import retrofit2.Response

class GameTeamViewModel(
    private val repository: PlayerRepository
) : BaseViewModel(repository) {
    /* ------------ Секция для операций связанных с созданием / редактированием команды ------------ */
    // Состояние для создания новой команды в системе
    private val _createTeamResponse: MutableLiveData<Resource<Response<ResponseBody>>> =
        MutableLiveData()
    val createTeamResponse: LiveData<Resource<Response<ResponseBody>>>
        get() = _createTeamResponse

    /**
     * Создание новой команды
     */
    fun createTeam(
        body: TeamCreateModel
    ) = viewModelScope.launch {
        // Установка данных по умолчанию (загрузка)
        _createTeamResponse.value = Resource.Loading

        // Изменение значения на возвращаемый функцией добавления метки репозитория
        _createTeamResponse.value = repository.playerCommandCreate(body)
    }

    /* ------------ Секция для операций связанных с созданием / редактированием команды ------------ */
    // Информация о команде
    private val _commandStatus: MutableLiveData<CommandStatusModel> = MutableLiveData()
    val commandStatus: LiveData<CommandStatusModel>
        get() = _commandStatus

    /**
     * Установка новой информации о статусе в команде
     */
    fun setCommandStatus(status: CommandStatusModel) = viewModelScope.launch {
        _commandStatus.value = status
    }

    /* ------------ Секция для операций связанных с получением информации о командах ------------ */
    // Информация о команде
    private val _commands: MutableLiveData<Resource<Response<ResponseBody>>> =
        MutableLiveData()
    val commands: LiveData<Resource<Response<ResponseBody>>>
        get() = _commands

    /**
     * Установка новой информации о статусе в команде
     */
    fun commandsList() = viewModelScope.launch {
        _commands.value = Resource.Loading
        _commands.value = repository.playerCommandsList()
    }
}