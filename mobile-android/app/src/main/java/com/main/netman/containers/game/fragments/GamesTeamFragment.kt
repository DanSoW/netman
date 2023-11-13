package com.main.netman.containers.game.fragments

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.main.netman.R
import com.main.netman.containers.base.BaseFragment
import com.main.netman.containers.game.models.GameTeamViewModel
import com.main.netman.databinding.FragmentGamesTeamBinding
import com.main.netman.databinding.FragmentLeadTeamBinding
import com.main.netman.network.apis.PlayerApi
import com.main.netman.repositories.PlayerRepository


class GamesTeamFragment(
    private var commandStatus: Int?,
    private var commandsId: Int?
) : BaseFragment<GameTeamViewModel, FragmentGamesTeamBinding, PlayerRepository>() {

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)
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
    ) = FragmentGamesTeamBinding.inflate(inflater, container, false)

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