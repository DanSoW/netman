package com.main.netman.containers.game.fragments

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.gson.Gson
import com.main.netman.R
import com.main.netman.containers.base.BaseFragment
import com.main.netman.containers.game.adapters.CommandAdapter
import com.main.netman.containers.game.adapters.TeamViewPagerAdapter
import com.main.netman.containers.game.models.GameTeamViewModel
import com.main.netman.databinding.FragmentFindTeamBinding
import com.main.netman.databinding.FragmentLeadTeamBinding
import com.main.netman.models.command.CommandInfoModel
import com.main.netman.models.command.TeamCreateModel
import com.main.netman.models.command.TeamCreateRequestModel
import com.main.netman.models.error.ErrorModel
import com.main.netman.network.Resource
import com.main.netman.network.apis.PlayerApi
import com.main.netman.repositories.PlayerRepository
import com.main.netman.utils.handleApiError
import com.main.netman.utils.handleErrorMessage
import com.main.netman.utils.handleSuccessMessage
import com.main.netman.utils.hideKeyboard
import com.main.netman.utils.visible


class LeadTeamFragment :
    BaseFragment<GameTeamViewModel, FragmentLeadTeamBinding, PlayerRepository>() {
    private var _viewPagerAdapter: TeamViewPagerAdapter? = null

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)

        // Определение адаптера для View Pager
        _viewPagerAdapter = TeamViewPagerAdapter(
            childFragmentManager,
            "",
            viewModel.commandStatus.value?.status,      // Статус игрока в команде
            viewModel.commandStatus.value?.commandsId   // Идентификатор команды
        )
        binding.fltViewPager.adapter = _viewPagerAdapter
        binding.fltTabLayout.setupWithViewPager(binding.fltViewPager)
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
    ) = FragmentLeadTeamBinding.inflate(inflater, container, false)

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