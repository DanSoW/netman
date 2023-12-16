package com.main.netman.containers.home.fragments

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.annotation.DrawableRes
import androidx.appcompat.content.res.AppCompatResources
import androidx.lifecycle.MutableLiveData
import com.google.gson.Gson
import com.main.netman.R
import com.main.netman.constants.socket.SocketHandlerConstants
import com.main.netman.containers.base.BaseFragment
import com.main.netman.containers.home.models.MapViewModel
import com.main.netman.databinding.FragmentMapBinding
import com.main.netman.models.PointD
import com.main.netman.models.user.GamePlayerCoordinatesModel
import com.main.netman.models.user.UserCoordsModel
import com.main.netman.network.handlers.SCSocketHandler
import com.main.netman.repositories.MapRepository
import com.main.netman.utils.DrawableToBitmap
import com.main.netman.utils.LocationPermissionHelper
import com.mapbox.android.gestures.MoveGestureDetector
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.Style
import com.mapbox.maps.extension.style.expressions.dsl.generated.interpolate
import com.mapbox.maps.plugin.LocationPuck2D
import com.mapbox.maps.plugin.annotation.AnnotationConfig
import com.mapbox.maps.plugin.annotation.AnnotationSourceOptions
import com.mapbox.maps.plugin.annotation.annotations
import com.mapbox.maps.plugin.annotation.generated.PointAnnotation
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationManager
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationOptions
import com.mapbox.maps.plugin.annotation.generated.createPointAnnotationManager
import com.mapbox.maps.plugin.gestures.OnMoveListener
import com.mapbox.maps.plugin.gestures.gestures
import com.mapbox.maps.plugin.locationcomponent.OnIndicatorBearingChangedListener
import com.mapbox.maps.plugin.locationcomponent.OnIndicatorPositionChangedListener
import com.mapbox.maps.plugin.locationcomponent.location
import io.socket.client.Socket
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

class MapFragment : BaseFragment<MapViewModel, FragmentMapBinding, MapRepository>() {
    // Socket
    private val _socket: MutableLiveData<Socket?> = MutableLiveData(SCSocketHandler.getSocket())

    private lateinit var point: PointD

    // Помощник для определения разрешения на получения доступа к геолокации пользователя
    private lateinit var locationPermissionHelper: LocationPermissionHelper

    // Координаты игроков в команде
    private var commandPlayers: MutableMap<Int, PointD> = mutableMapOf()

    // Задача на получение координат других игроков
    private var _coroutineGetCoordinates: Job? = null
    private var _coroutineIO: Job? = null

    private val onIndicatorBearingChangedListener = OnIndicatorBearingChangedListener {
        // [Отключено, т.к. вызывает слишком большие изменения экрана, что нежелательно]
        // binding.mapView.getMapboxMap().setCamera(CameraOptions.Builder().bearing(it).build())
    }

    private val onIndicatorPositionChangedListener = OnIndicatorPositionChangedListener {
        val point = Point.fromLngLat(104.279491, 52.281000)
        binding.mapView.getMapboxMap().setCamera(CameraOptions.Builder().center(point).build())
        binding.mapView.gestures.focalPoint =
            binding.mapView.getMapboxMap().pixelForCoordinate(point)

        // Сохранение текущих координат пользователя
        // viewModel.setCoords(it.latitude(), it.longitude())
        viewModel.setCoords(point.latitude(), point.longitude())
    }

    /**
     * Переопределённый объект OnMoveListener.
     * Обрабатывает перемещения пользователя по карте.
     */
    private val onMoveListener = object : OnMoveListener {
        override fun onMoveBegin(detector: MoveGestureDetector) {
            // onCameraTrackingDismissed()
        }

        override fun onMove(detector: MoveGestureDetector): Boolean {
            return false
        }

        override fun onMoveEnd(detector: MoveGestureDetector) {
        }
    }

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)
        point = PointD(52.282473, 104.279491)

        binding.mapView.getMapboxMap().loadStyleUri(Style.MAPBOX_STREETS)

        locationPermissionHelper = LocationPermissionHelper(WeakReference(requireActivity()))
        locationPermissionHelper.checkPermissions {
            onMapReady()
        }

        viewModel.coords.observe(viewLifecycleOwner) {
            if (it == null) {
                return@observe
            }

            if (_socket.value != null && SCSocketHandler.getAuth()) {
                _socket.value?.emit(
                    SocketHandlerConstants.SET_CURRENT_COORDINATES,
                    Gson().toJson(UserCoordsModel(lat = it.first, lng = it.second))
                )
            }

            if (binding.mapView.getMapboxMap().getStyle()?.isStyleLoaded == true) {
                addElementToMap(R.drawable.mapbox_user_puck_icon, PointD(it.first, it.second))
            }
        }

        _socket.observe(viewLifecycleOwner) {
            if (it == null) {
                return@observe
            }

            if ((_coroutineIO != null) && (_coroutineIO?.isActive == true)) {
                _coroutineIO!!.cancel()
            }

            // Обработка события "передача своих координат другим членам команды (only online)"
            if (it.hasListeners(SocketHandlerConstants.GET_PLAYER_COORDINATES)) {
                it.off(SocketHandlerConstants.GET_PLAYER_COORDINATES)
            }

            it.on(SocketHandlerConstants.GET_PLAYER_COORDINATES) { _ ->
                it.emit(
                    SocketHandlerConstants.SET_PLAYER_COORDINATES, Gson().toJson(
                        UserCoordsModel(
                            lat = viewModel.coords.value?.first,
                            lng = viewModel.coords.value?.second
                        )
                    )
                )
            }

            // Обработка события "очистить все изображения на карте"
            if (it.hasListeners(SocketHandlerConstants.CLEAR_GAMES_MARKS)) {
                it.off(SocketHandlerConstants.CLEAR_GAMES_MARKS)
            }

            it.on(SocketHandlerConstants.CLEAR_GAMES_MARKS) {
                // Добавление координат игрока
                activity?.runOnUiThread {
                    cleanUp()

                    if (binding.mapView.getMapboxMap().getStyle()?.isStyleLoaded == true
                        && viewModel.coords.isInitialized
                        && viewModel.coords != null) {
                        addElementToMap(
                            R.drawable.mapbox_user_puck_icon,
                            PointD(viewModel.coords.value!!.first, viewModel.coords.value!!.second)
                        )
                    }
                }
            }

            if (it.hasListeners(SocketHandlerConstants.ADD_PLAYER_COORDINATES)) {
                it.off(SocketHandlerConstants.ADD_PLAYER_COORDINATES)
            }

            it.on(SocketHandlerConstants.ADD_PLAYER_COORDINATES) { args ->
                if (args[0] != null) {
                    val data = Gson().fromJson(
                        (args[0] as String),
                        GamePlayerCoordinatesModel::class.java
                    )

                    activity?.runOnUiThread {
                        if (!(commandPlayers.contains(data.usersId))) {
                            commandPlayers[data.usersId] = PointD(data.lat, data.lng)
                        } else {
                            val value = commandPlayers[data.usersId]
                            value?.x = data.lat
                            value?.y = data.lng
                        }

                        renderMapData()
                    }
                }
            }

            if(it.hasListeners(SocketHandlerConstants.TEAM_PLAYER_DISCONNECT)){
                it.off(SocketHandlerConstants.TEAM_PLAYER_DISCONNECT)
            }

            // Удаление координат игроков, которые отключились от игрового процесса
            it.on(SocketHandlerConstants.TEAM_PLAYER_DISCONNECT) { args ->
                Log.w("HELLO", "DISCONNECT: ${args}")
                if(args[0] != null){
                    val obj = Gson().fromJson((args[0] as String), GamePlayerCoordinatesModel::class.java)

                    activity?.runOnUiThread {
                        Log.w("HELLO", "DISCONNECT: ${obj.usersId}")
                        if(commandPlayers.containsKey(obj.usersId)){
                            commandPlayers.remove(obj.usersId)
                            renderMapData()
                        }
                    }
                }
            }

            // Запуск корутины для постоянного опроса игроков о их новых координатах
            _coroutineIO = CoroutineScope(Dispatchers.IO).launch {
                try {
                    if ((_coroutineGetCoordinates != null) && (_coroutineGetCoordinates?.isActive == true)) {
                        _coroutineGetCoordinates!!.cancel()
                    }

                    _coroutineGetCoordinates = CoroutineScope(Dispatchers.IO).launch {
                        try {
                            while (true) {
                                it.emit(SocketHandlerConstants.COORDINATES_PLAYERS)
                                delay(1000)
                            }
                        } catch (e: CancellationException) {
                        }
                    }

                    _coroutineGetCoordinates?.join()
                } catch (e: CancellationException) {
                    _coroutineGetCoordinates?.cancel()
                }
            }
        }

        socketConnection()
    }

    private fun renderMapData(withoutKey: Int? = null) {
        if (binding.mapView.getMapboxMap().getStyle()?.isStyleLoaded == true) {
            cleanUp()

            if(viewModel.coords.isInitialized && viewModel.coords != null) {
                addElementToMap(
                    R.drawable.mapbox_user_puck_icon,
                    PointD(
                        viewModel.coords.value!!.first,
                        viewModel.coords.value!!.second
                    )
                )
            }

            for(item in commandPlayers){
                addElementToMap(
                    R.drawable.mapbox_user_command_icon,
                    item.value
                )
            }
        }
    }

    /**
     * Метод получения ViewModel текущего фрагмента
     */
    override fun getViewModel() = MapViewModel::class.java

    /**
     * Метод получения экземпляра фрагмента
     */
    override fun getFragmentBinding(
        inflater: LayoutInflater,
        container: ViewGroup?
    ) = FragmentMapBinding.inflate(inflater, container, false)

    /**
     * Метод получения репозитория данного фрагмента
     */
    override fun getFragmentRepository() =
        MapRepository(coordsPreferences)

    @SuppressLint("Lifecycle")
    override fun onStart() {
        super.onStart()
        binding.mapView.onStart()
    }

    @SuppressLint("Lifecycle")
    override fun onStop() {
        super.onStop()
        binding.mapView.onStop()
        _coroutineGetCoordinates?.cancel()
        _coroutineIO?.cancel()
    }

    @SuppressLint("Lifecycle")
    override fun onLowMemory() {
        super.onLowMemory()
        binding.mapView.onLowMemory()
    }

    private fun onMapReady() {
        // Первоначальная установка камеры
        binding.mapView.getMapboxMap().setCamera(
            CameraOptions.Builder()
                .zoom(14.0)
                .build()
        )

        // Отмена скролла пользователем по карте
        binding.mapView.gestures.scrollEnabled = false

        // Визуализация карты
        viewMap()
    }

    /**
     * Визуализация карты на экране мобильного устройства
     */
    private fun viewMap() {
        // Добавление стилей для карты
        binding.mapView.getMapboxMap().loadStyleUri(Style.MAPBOX_STREETS) {
            // Инициализация компонента локации
            initLocationComponent()
        }

        // Добавление маркеров на карту
        /*coroutineScope {
            launch {
                for(i in 0..10){
                    var newPoint = PointD(point.x, point.y + (i.toDouble() / 10000))
                    addElementToMap(R.drawable.mapbox_user_command_icon, newPoint)
                }
            }
        }*/
    }

    /**
     * Добавление слушателя перемещений
     */
    private fun setupGesturesListener() {
        binding.mapView.gestures.addOnMoveListener(onMoveListener)
    }

    /**
     * Инициализация компонента локации
     */
    private fun initLocationComponent() {
        val locationComponentPlugin = binding.mapView.location

        locationComponentPlugin.updateSettings {
            this.enabled = true
            this.locationPuck = LocationPuck2D(
                // Активное изображение
                bearingImage = AppCompatResources.getDrawable(
                    requireContext(),
                    R.drawable.mapbox_user_puck_icon,
                ),

                // Скрытое изображение
                shadowImage = AppCompatResources.getDrawable(
                    requireContext(),
                    R.drawable.mapbox_user_icon_shadow,
                ),

                // Масштабирование
                scaleExpression = interpolate {
                    linear()
                    zoom()
                    stop {
                        literal(0.0)
                        literal(0.6)
                    }
                    stop {
                        literal(20.0)
                        literal(1.0)
                    }
                }.toJson()
            )
        }

        // Добавление индикаторов
        locationComponentPlugin.addOnIndicatorPositionChangedListener(
            onIndicatorPositionChangedListener
        )
        locationComponentPlugin.addOnIndicatorBearingChangedListener(
            onIndicatorBearingChangedListener
        )
    }

    /**
     * Прекращение движения за камерой
     */
    private fun onCameraTrackingDismissed() {
        binding.mapView.location
            .removeOnIndicatorPositionChangedListener(onIndicatorPositionChangedListener)
        binding.mapView.location
            .removeOnIndicatorBearingChangedListener(onIndicatorBearingChangedListener)
        // binding.mapView.gestures.removeOnMoveListener(onMoveListener)
    }

    override fun onDestroy() {
        super.onDestroy()
        binding.mapView.location
            .removeOnIndicatorBearingChangedListener(onIndicatorBearingChangedListener)
        binding.mapView.location
            .removeOnIndicatorPositionChangedListener(onIndicatorPositionChangedListener)
        //binding.mapView.gestures.removeOnMoveListener(onMoveListener)

        _coroutineGetCoordinates?.cancel()
        _coroutineIO?.cancel()

    }

    @Deprecated("Deprecated in Java")
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        locationPermissionHelper.onRequestPermissionsResult(requestCode, permissions, grantResults)
    }

    /**
     * Очистка карты от всех устаревших аннотаций
     */
    private fun cleanUp() {
        binding.mapView.annotations.cleanup()
    }

    /**
     * Добавление элемента на карту
     */
    private fun addElementToMap(@DrawableRes resourceId: Int, point: PointD): PointAnnotation? {
        val resource = DrawableToBitmap.bitmapFromDrawableRes(
            requireContext(),
            resourceId
        ) ?: return null

        // Создаём экземпляр API аннотаций и получаем Point AnnotationManager
        val annotationApi = binding.mapView.annotations
        val pointAnnotationManager = annotationApi.createPointAnnotationManager()

        // Устанавливаем параметры для результирующего слоя символов.
        val pointAnnotationOptions: PointAnnotationOptions = PointAnnotationOptions()
            // Определяем географические координаты маркера.
            .withPoint(Point.fromLngLat(point.y, point.x))
            // Указываем растровое изображение, которое присваиваем точечной аннотации
            // Растровое изображение будет автоматически добавлено в стиль карты
            .withIconImage(resource)

        // Добавление результирующего pointAnnotation на карту
        return pointAnnotationManager.create(pointAnnotationOptions)
    }

    private fun socketConnection() {
        CoroutineScope(Dispatchers.IO).launch {
            while (SCSocketHandler.getSocket() == null ||
                (!(SCSocketHandler.getSocket()?.connected()!!))
            ) {
                withContext(Dispatchers.Main) {
                    _socket.value = SCSocketHandler.getSocket()
                }
                delay(5000)
            }
        }
    }
}