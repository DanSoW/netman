package com.main.netman.containers.home

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.PackageManager
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.View
import androidx.core.app.ActivityCompat
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.google.gson.Gson
import com.main.netman.R
import com.main.netman.constants.socket.SocketHandlerConstants
import com.main.netman.containers.game.GameActivity
import com.main.netman.containers.messenger.MessengerActivity
import com.main.netman.containers.profile.ProfileActivity
import com.main.netman.databinding.ActivityHomeBinding
import com.main.netman.models.auth.AuthModel
import com.main.netman.models.command.CommandStatusModel
import com.main.netman.models.game.CurrentGameModel
import com.main.netman.models.user.GameStatusModel
import com.main.netman.network.handlers.SCSocketHandler
import com.main.netman.store.UserPreferences
import com.main.netman.store.userDataStore
import com.main.netman.utils.startStdActivity
import com.main.netman.utils.visible
import io.socket.client.Socket
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
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

    // Socket
    private val _socket: MutableLiveData<Socket?> = MutableLiveData(SCSocketHandler.getSocket())
    val socket: LiveData<Socket?>
        get() = _socket

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

        userPreferences = UserPreferences(userDataStore)

        val data = Gson().fromJson(runBlocking {
            userPreferences.auth.first()
        }, AuthModel::class.java)

        if (socket.value == null) {
            // Подключение к основному серверу
            socketConnection()
        }

        binding.icArrow.setOnClickListener {
            // Поворот view элемента на 180 градусов
            binding.icArrow.rotation = binding.icArrow.rotation + 180f
            if (binding.tvTaskDescription.visibility == View.VISIBLE) {
                binding.tvTaskDescription.visibility = View.GONE
            } else {
                binding.tvTaskDescription.visibility = View.VISIBLE
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

            it.on(SocketHandlerConstants.STATUS_ON) { itLocal ->
                if (itLocal.isEmpty()) {
                    return@on
                }

                // Получение статуса игрока в текущий момент времени
                val status =
                    Gson().fromJson(itLocal.first() as String, GameStatusModel::class.java)

                if (status.judge) {
                    runOnUiThread {
                        binding.cardTask.visibility = View.GONE
                        binding.cardHint.visibility = View.GONE
                    }
                } else if (status.player) {
                    if (itLocal.size > 1 && itLocal[1] != null) {
                        runOnUiThread {
                            binding.cardTask.visibility = View.VISIBLE
                            binding.cardHint.visibility = View.VISIBLE

                            val task =
                                Gson().fromJson(itLocal[1].toString(), CurrentGameModel::class.java)
                            binding.tvTaskDescription.text = task.task
                            binding.tvNumberQuest.text = "№ ${task.number}"
                            binding.tvGameHint.text = task.hint
                        }
                    }
                } else {
                    runOnUiThread {
                        binding.cardTask.visibility = View.GONE
                        binding.cardHint.visibility = View.GONE
                    }
                }

                /*if(args[0] != null){
                    val data = args[0] as String
                    val gson = Gson()
                    val gstat = gson.fromJson(data, GameStatusModel::class.java)
                    if(gstat.judge){
                        if(!_beginJudgeState){
                            _gameStatusPlayer = ConfigStatusPlayer.JUDGE

                            CoroutineScope(Dispatchers.Main).launch {
                                _bottomNavigationView?.menu?.findItem(R.id.Team)?.setIcon(R.drawable.ic_star_ruler)

                                _tbMain?.visibility = View.GONE
                                _tbHintContainer?.visibility = View.GONE

                                _hintTextView?.text = ""
                                _tbTextView?.text = ""
                                _tbTextViewCentral?.text = ""
                            }
                        }
                        _beginJudgeState = true

                        if(args[1] != null){
                            val dataStatus = args[1] as String
                            _judgeData = gson.fromJson(dataStatus, JudgeInfoModel::class.java)
                        }
                    }else if(gstat.player){
                        _gameStatusPlayer = ConfigStatusPlayer.PLAYER_ACTIVE

                        if(_beginJudgeState){
                            _bottomNavigationView?.menu?.findItem(R.id.Team)?.setIcon(R.drawable.ic_team)
                        }
                        _beginJudgeState = false
                        if(args[1] != null){
                            val data = gson.fromJson((args[1] as String), GameCurrentQuestModel::class.java)
                            _currentQuestData = data
                            CoroutineScope(Dispatchers.Main).launch {
                                if(gstat.playerStatus.toByte() == ConfigStatusPlayer.PLAYER_ACTIVE_VIDEO){
                                    // Данный игрок может вести съёмку видео (снимает пока не закончит съёмку)
                                    if(_refMediaInstructions != null){
                                        var intent = Intent(this@MainActivity, VideoActivity::class.java)
                                        intent.putExtra("player_status", ConfigStatusPlayer.PLAYER_ACTIVE_VIDEO)
                                        intent.putExtra("game_info", gson.toJson(_currentQuestData))
                                        intent.putExtra("user_data", _shared?.getString(ConfigStorage.USERS_DATA, null))
                                        intent.putExtra("ref_media", gson.toJson(_refMediaInstructions))
                                        _socket?.off("status_on")
                                        startActivity(intent)
                                    }
                                }else{
                                    _tbMain?.visibility = View.VISIBLE
                                    _tbHintContainer?.visibility = View.VISIBLE

                                    _hintTextView?.text = data.hint
                                    _tbTextView?.text = data.task
                                    _tbTextViewCentral?.text = "№" + data.number
                                }
                            }
                        }
                    }else{
                        _gameStatusPlayer = ConfigStatusPlayer.PLAYER_DEFAULT

                        if(_beginJudgeState){
                            CoroutineScope(Dispatchers.Main).launch {
                                _bottomNavigationView?.menu?.findItem(R.id.Team)?.setIcon(R.drawable.ic_team)
                            }
                        }

                        _beginJudgeState = false
                        CoroutineScope(Dispatchers.Main).launch {
                            _tbMain?.visibility = View.GONE
                            _tbHintContainer?.visibility = View.GONE

                            _hintTextView?.text = ""
                            _tbTextView?.text = ""
                            _tbTextViewCentral?.text = ""
                        }
                    }
                }else{
                    _tbMain?.visibility = View.GONE
                    _tbHintContainer?.visibility = View.GONE
                }*/
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

        when (menuId) {
            /*
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
            this,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
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