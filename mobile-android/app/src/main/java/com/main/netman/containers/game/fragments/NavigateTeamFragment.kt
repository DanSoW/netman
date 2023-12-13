package com.main.netman.containers.game.fragments

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.navigation.findNavController
import androidx.navigation.fragment.findNavController
import com.google.gson.Gson
import com.main.netman.R
import com.main.netman.constants.data.value.CommandStatus
import com.main.netman.constants.socket.SocketHandlerConstants
import com.main.netman.containers.base.BaseFragment
import com.main.netman.containers.game.models.GameTeamViewModel
import com.main.netman.databinding.FragmentNavigateTeamBinding
import com.main.netman.models.command.CommandStatusModel
import com.main.netman.models.command.TeamCreateModel
import com.main.netman.models.user.UserCoordsModel
import com.main.netman.network.apis.PlayerApi
import com.main.netman.network.handlers.SCSocketHandler
import com.main.netman.repositories.PlayerRepository
import com.main.netman.utils.navigation
import io.socket.client.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

/**
 * Фрагмент для навигации между другими фрагментами, которые связаны с командой
 */
class NavigateTeamFragment :
    BaseFragment<GameTeamViewModel, FragmentNavigateTeamBinding, PlayerRepository>() {
    // Socket
    private val _socket: MutableLiveData<Socket?> = MutableLiveData(SCSocketHandler.getSocket())
    val socket: LiveData<Socket?>
        get() = _socket

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)

        if (socket.value == null) {
            // Подключение к основному серверу
            socketConnection()
        }

        _socket.observe(viewLifecycleOwner) {
            if (it == null) {
                return@observe
            }

            // Добавляем обработчик получения статуса о команде, если его нет
            if (it.hasListeners(SocketHandlerConstants.COMMAND_STATUS_ON)) {
                it.off(SocketHandlerConstants.COMMAND_STATUS_ON)
            }

            // Создание обработчика, который отработает при получении информации о команде
            it.on(SocketHandlerConstants.COMMAND_STATUS_ON) { itLocal ->
                if ((itLocal != null) && (itLocal.isNotEmpty()) && (itLocal.first() != null)) {
                    val data = itLocal.first() as String
                    val result = Gson().fromJson(data, CommandStatusModel::class.java)
                    viewModel.setCommandStatus(result)
                }
            }

            viewModel.setCommandStatus(null)
            // Отправка запроса на получение статуса команды
            it.emit(SocketHandlerConstants.COMMAND_STATUS)
        }

        viewModel.commandStatus.observe(viewLifecycleOwner) {
            if (it == null) {
                runBlocking {
                    commandPreferences.saveCommand("")
                }
                return@observe
            }

            // Сохранение статуса о команде пользователя в локальное хранилище
            val status = Gson().toJson(it)
            runBlocking {
                commandPreferences.saveCommand(status)
            }

            if (it.status == CommandStatus.WITHOUT_TEAM) {
                // Если у пользователя нет команды, то отправляем его её искать или создавать новую
                navigation(R.id.action_navigateTeamFragment_to_findTeamFragment)
            } else if (it.status == CommandStatus.TEAM_CREATOR) {
                // Если пользователь создатель команды, то отправляем его на страницу создателя команы
                val args = Bundle()
                args.putInt("commands_id", it.commandsId)
                navigation(R.id.action_navigateTeamFragment_to_leadTeamFragment, args)
            } else if (it.status == CommandStatus.TEAM_MEMBER) {
                // Если у пользователя есть команда, то отправляем его на страницу его команды
                val args = Bundle()
                args.putInt("commands_id", it.commandsId)
                navigation(R.id.action_navigateTeamFragment_to_memberTeamFragment, args)
            }
        }
    }

    /**
     * Метод получения ViewModel текущего фрагмента
     */
    override fun getViewModel() = GameTeamViewModel::class.java

    /**
     * Метод получения экземпляра фрагмента
     */
    override fun getFragmentBinding(
        inflater: LayoutInflater,
        container: ViewGroup?
    ) = FragmentNavigateTeamBinding.inflate(inflater, container, false)

    /**
     * Метод получения репозитория данного фрагмента
     */
    override fun getFragmentRepository() =
        PlayerRepository(
            remoteDataSource.buildApi(
                PlayerApi::class.java,
                userPreferences,
                cookiePreferences
            )
        )

    private fun socketConnection() {
        CoroutineScope(Dispatchers.IO).launch {
            withContext(Dispatchers.Main) {
                _socket.value = null
            }
            SCSocketHandler.setSocket()
            SCSocketHandler.connection()

            withContext(Dispatchers.Main) {
                _socket.value = SCSocketHandler.getSocket()
            }
        }
    }
}