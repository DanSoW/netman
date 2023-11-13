package com.main.netman.containers.game.fragments

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.LinearLayoutManager
import com.main.netman.R
import com.main.netman.constants.data.value.PlayerStatus
import com.main.netman.containers.base.BaseFragment
import com.main.netman.containers.game.models.GameTeamViewModel
import com.main.netman.databinding.FragmentPlayersTeamBinding
import com.main.netman.network.apis.PlayerApi
import com.main.netman.repositories.PlayerRepository

class PlayersTeamFragment(
    private var type: String,
    private var commandsId: Int?,
    private var playerStatus: Int = PlayerStatus.PLAYER_DEFAULT
) : BaseFragment<GameTeamViewModel, FragmentPlayersTeamBinding, PlayerRepository>() {

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)

        binding.fptPlayerList.layoutManager = LinearLayoutManager(activity)

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
    ) = FragmentPlayersTeamBinding.inflate(inflater, container, false)

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

}