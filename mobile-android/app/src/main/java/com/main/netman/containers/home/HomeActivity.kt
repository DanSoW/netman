package com.main.netman.containers.home

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.PackageManager
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.Button
import androidx.core.app.ActivityCompat
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.gson.Gson
import com.main.netman.R
import com.main.netman.constants.game.ViewStatusConstants
import com.main.netman.constants.socket.SocketHandlerConstants
import com.main.netman.containers.game.GameActivity
import com.main.netman.containers.profile.ProfileActivity
import com.main.netman.databinding.ActivityHomeBinding
import com.main.netman.event.CurrentGameEvent
import com.main.netman.event.RemoveMarkEvent
import com.main.netman.event.ViewMarkEvent
import com.main.netman.models.auth.AuthModel
import com.main.netman.models.game.CurrentGameModel
import com.main.netman.models.game.GameQuestModel
import com.main.netman.network.handlers.SCSocketHandler
import com.main.netman.store.CurrentQuestPreferences
import com.main.netman.store.UserPreferences
import com.main.netman.store.currentQuestDataStore
import com.main.netman.store.userDataStore
import com.main.netman.utils.handleErrorMessage
import com.main.netman.utils.startStdActivity
import com.main.netman.utils.visible
import io.socket.client.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.greenrobot.eventbus.EventBus
import java.util.ArrayDeque

/**
 * Домашняя страница мобильного приложения (основная активность, которая связывает все остальные
 * фрагменты и активности между собой)
 */
class HomeActivity : AppCompatActivity() {
    // Очередь идентификаторов фрагментов или активностей, на которые нужно перейти
    private var idDeque: ArrayDeque<Int> = ArrayDeque()
    private var flag: Boolean = true
    private lateinit var binding: ActivityHomeBinding
    private lateinit var userPreferences: UserPreferences
    private lateinit var currentQuestPreferences: CurrentQuestPreferences

    // Socket
    private val _socket: MutableLiveData<Socket?> = MutableLiveData(SCSocketHandler.getSocket())
    val socket: LiveData<Socket?>
        get() = _socket

    // Информация о текущей игре (RAM Storage)
    private var currentGame: CurrentGameModel? = null

    @SuppressLint("SetTextI18n")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        // showMessage(binding.root)

        // Инициализация BottomNavigationView
        setupBottomNavigationView()

        // Имитация загрузки страницы
        /*binding.fcvActivityHome.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
            binding.pbActivityHome.visible(
                false
            )
        }*/

        idDeque.add(R.id.itemMapMenu)
        binding.bnvActivityHome.menu.findItem(R.id.itemMapMenu).isChecked = true

        // Установка badges
        // badgeSetup(R.id.itemMessengerMenu, 100)

        // Запрашивание разрешения для работы с файловым хранилищем
        // verifyStoragePermissions()

        // Инициализация локальных хранилищ
        userPreferences = UserPreferences(userDataStore)
        currentQuestPreferences = CurrentQuestPreferences(currentQuestDataStore)

        // Предварительная очистка всех данных о старом квесте (если таковой имеется)
        runBlocking {
            // currentQuestPreferences.clear()
        }

        val data = Gson().fromJson(runBlocking {
            userPreferences.auth.first()
        }, AuthModel::class.java)

        if (socket.value == null) {
            // Подключение к основному серверу
            socketConnection()
        }

        binding.icArrow.setOnClickListener {
            // Поворот view элемента на 180 градусов
            binding.icArrow.rotation += 180f
            if (binding.descriptionScrollView.visibility == View.VISIBLE) {
                binding.descriptionScrollView.visibility = View.GONE
            } else {
                binding.descriptionScrollView.visibility = View.VISIBLE
            }
        }

        binding.icArrowAction.setOnClickListener {
            binding.icArrowAction.rotation += 180f
            if (binding.actionScrollView.visibility == View.VISIBLE) {
                binding.actionScrollView.visibility = View.GONE
            } else {
                binding.actionScrollView.visibility = View.VISIBLE
            }
        }

        // Определение обработчиков для сокета после подключения
        socket.observe(this) {
            if (it == null) {
                return@observe
            }

            if (it.hasListeners(SocketHandlerConstants.AUTH_SUCCESS)) {
                it.off(SocketHandlerConstants.AUTH_SUCCESS)
            }

            if (it.hasListeners(SocketHandlerConstants.STATUS_ON)) {
                it.off(SocketHandlerConstants.STATUS_ON)
            }

            // Обработка получения статуса пользователя в текущий момент времени
            it.on(SocketHandlerConstants.STATUS_ON) { itLocal ->
                if (itLocal.isEmpty()) {
                    return@on
                }

                // Данные о статусе в виде строке
                val statusStr = itLocal.first() as String

                // Получение статуса игрока в текущий момент времени
                val status = Gson().fromJson(statusStr, GameQuestModel::class.java)

                // Запуск инструкций в UI-потоке
                runOnUiThread {
                    binding.cardTask.visibility = View.VISIBLE
                    binding.tvTaskDescription.text = status.task

                    binding.icCameraOn.visibility = View.GONE
                    binding.icCameraOff.visibility = View.GONE

                    if (status.view == ViewStatusConstants.VISIBLE) {
                        binding.icCameraOn.visibility = View.VISIBLE

                        binding.tvNumberQuest.text = "Действие"
                        binding.tvTaskDescription.text = status.action

                        // Отправляем на шину данных информацию о текущем квесте для визуализации
                        EventBus.getDefault().post(
                            ViewMarkEvent(
                                questId = status.id,
                                mark = status.mark
                            )
                        )
                    }

                    // Сохранение данных о квесте в локальном хранилище
                    runBlocking {
                        currentQuestPreferences.saveData(statusStr)
                    }
                }
            }

            if (it.hasListeners(SocketHandlerConstants.REPEAT_STATUS_REQUEST)) {
                it.off(SocketHandlerConstants.REPEAT_STATUS_REQUEST)
            }

            it.on(SocketHandlerConstants.REPEAT_STATUS_REQUEST) { _ ->
                it.emit(SocketHandlerConstants.STATUS)
            }

            if (it.hasListeners(SocketHandlerConstants.STATUS_COMPLETED)) {
                it.off(SocketHandlerConstants.STATUS_COMPLETED)
            }

            it.on(SocketHandlerConstants.STATUS_COMPLETED) { itLocal ->
                runOnUiThread {
                    binding.cardTask.visibility = View.GONE
                    binding.icCameraOn.visibility = View.GONE
                    binding.icCameraOff.visibility = View.GONE

                    binding.cardStatusSuccess.visibility = View.VISIBLE
                    binding.tvStatus.text = "Все квесты пройдены!"
                }
            }

            if (it.hasListeners(SocketHandlerConstants.GAME_OVER)) {
                it.off(SocketHandlerConstants.GAME_OVER)
            }

            it.on(SocketHandlerConstants.GAME_OVER) { _ ->
                // Отправляем сообщение о том, чтобы отключиться от текущей командной комнаты
                it.emit(SocketHandlerConstants.GAME_OVER_DISCONNECT)
            }

            if (it.hasListeners(SocketHandlerConstants.GAME_OVER_DISCONNECT_SUCCESS)) {
                it.off(SocketHandlerConstants.GAME_OVER_DISCONNECT_SUCCESS)
            }

            // Обработка "полного" завершения игрового процесса
            it.on(SocketHandlerConstants.GAME_OVER_DISCONNECT_SUCCESS) { _ ->
                // Очистка карты от других игроков
                EventBus.getDefault().post(CurrentGameEvent())
            }

            it.on(SocketHandlerConstants.AUTH_SUCCESS) { _ ->
                SCSocketHandler.setAuth(true)
                it.emit(SocketHandlerConstants.STATUS)
            }

            if (!SCSocketHandler.getAuth()) {
                it.emit(SocketHandlerConstants.AUTH, Gson().toJson(data))
            }

            if (SCSocketHandler.getAuth()) {
                it.emit(SocketHandlerConstants.STATUS)
            }
        }

        binding.icCameraOn.setOnClickListener {
            // Создание диалогового окна
            val dialogBuilder = MaterialAlertDialogBuilder(this)
            val viewDialog = layoutInflater.inflate(R.layout.dialog_captured_video, null)
            // Добавление view диалоговому окну
            dialogBuilder.setView(viewDialog)
            // Открытие диалогового окна
            val dialog: androidx.appcompat.app.AlertDialog? = dialogBuilder.show()

            // Обработка отмены создания команды
            viewDialog.findViewById<Button>(R.id.cancel_captured_video)
                .setOnClickListener(View.OnClickListener {
                    dialog?.dismiss()
                })

            // Отправка результата на прохождение квеста
            viewDialog.findViewById<Button>(R.id.accept_captured_video)
                .setOnClickListener(View.OnClickListener {
                    val strQuest = runBlocking {
                        currentQuestPreferences.data.first()
                    }

                    if (strQuest == null) {
                        return@OnClickListener
                    }

                    val dataQuest = Gson().fromJson(strQuest, GameQuestModel::class.java)
                    socket.value?.emit(SocketHandlerConstants.FINISHED_QUEST, strQuest)

                    // Удаляем маркер текущего квеста
                    EventBus.getDefault().post(
                        RemoveMarkEvent(
                            questId = dataQuest.id,
                            mark = dataQuest.mark
                        )
                    )

                    dialog?.dismiss()
                })
        }
    }

    override fun onStop() {
        super.onStop()
    }

    override fun onDestroy() {
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        idDeque.pop()

        if (!idDeque.isEmpty()) {
            loadActivity(getActivity(idDeque.peek()!!))
        } else {
            finish()
        }
    }

    private fun <A : Activity> loadActivity(activity: Class<A>?) {
        if (activity != null) {
            startStdActivity(activity)
            overridePendingTransition(0, 0)
        }
    }

    private fun getActivity(menuId: Int): Class<out Activity>? {
        binding.pbActivityHome.visible(true)
        binding.bnvActivityHome.menu.findItem(menuId).isChecked = true

        when (menuId) {/*
            R.id.itemMessengerMenu -> {
                return MessengerActivity::class.java
            }
             */

            /*R.id.itemCreatorMenu -> {
                return CreatorActivity::class.java
            }*/

            R.id.itemGameMenu -> {
                return GameActivity::class.java
            }

            R.id.itemMapMenu -> {
                return null
            }

            R.id.itemProfileMenu -> {
                return ProfileActivity::class.java
            }
        }

        return null
    }

    private fun setupBottomNavigationView() {
        binding.bnvActivityHome.setOnItemSelectedListener {
            if (idDeque.contains(it.itemId)) {
                if (it.itemId == R.id.itemMapMenu) {
                    if (idDeque.size != 1) {
                        if (flag) {
                            idDeque.addFirst(R.id.itemMapMenu)
                            flag = false
                        }
                    }
                }

                // Чтобы сохранять всю историю переходов нужно закомментировать данную строку
                idDeque.remove(it.itemId)
            }

            idDeque.push(it.itemId)
            loadActivity(getActivity(it.itemId))

            false
        }
    }

    private fun verifyStoragePermissions() {
        val permission = ActivityCompat.checkSelfPermission(
            this, Manifest.permission.WRITE_EXTERNAL_STORAGE
        )

        if (permission != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE),
                REQUEST_EXTERNAL_STORAGE_CODE
            )
        }
    }

    private fun badgeSetup(id: Int, alerts: Int) {
        val badge = binding.bnvActivityHome.getOrCreateBadge(id)
        badge.isVisible = true
        badge.number = alerts
    }

    private fun badgeClear(id: Int) {
        val badgeDrawable = binding.bnvActivityHome.getBadge(id)
        if (badgeDrawable != null) {
            badgeDrawable.isVisible = false
            badgeDrawable.clearNumber()
        }
    }

    private fun socketConnection() {
        CoroutineScope(Dispatchers.IO).launch {
            withContext(Dispatchers.Main) {
                _socket.value = null
            }
            SCSocketHandler.setSocket()
            SCSocketHandler.connection()

            /*while(SCSocketHandler.getSocket() == null ||
                (!(SCSocketHandler.getSocket()?.connected()!!))) {
                SCSocketHandler.setSocket()
                SCSocketHandler.connection()

                delay(5000)
            }*/

            withContext(Dispatchers.Main) {
                _socket.value = SCSocketHandler.getSocket()
            }
        }
    }

    companion object {
        const val REQUEST_EXTERNAL_STORAGE_CODE = 1
    }
}