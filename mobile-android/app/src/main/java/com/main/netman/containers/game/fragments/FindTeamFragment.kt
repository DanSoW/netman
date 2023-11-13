package com.main.netman.containers.game.fragments

import android.os.Bundle
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
import com.main.netman.containers.game.models.GameTeamViewModel
import com.main.netman.databinding.FragmentFindTeamBinding
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

class FindTeamFragment : BaseFragment<GameTeamViewModel, FragmentFindTeamBinding, PlayerRepository>() {
    private lateinit var commandAdapter: CommandAdapter

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)

        commandAdapter = CommandAdapter(
            requireContext(),
            commands = arrayListOf(
                CommandInfoModel(
                    name = "cmd 1",
                    score = 25
                ),
                CommandInfoModel(
                    name = "cmd 2",
                    score = 20
                ),
                CommandInfoModel(
                    name = "cmd 3",
                    score = 45
                ),
                CommandInfoModel(
                    name = "cmd 4",
                    score = 13
                ),
                CommandInfoModel(
                    name = "cmd 5",
                    score = 12
                ),
                CommandInfoModel(
                    name = "cmd 6",
                    score = 11
                )
            )
        )

        binding.rvFindCommand.adapter = commandAdapter

        binding.btnCreateTeam.setOnClickListener {
            val dialogBuilder = MaterialAlertDialogBuilder(requireContext())
            val viewDialog = layoutInflater.inflate(R.layout.dialog_create_team, null)
            dialogBuilder.setView(viewDialog)
            val dialog: androidx.appcompat.app.AlertDialog? = dialogBuilder.show()

            viewDialog.findViewById<Button>(R.id.cancel_create_command).setOnClickListener(View.OnClickListener {
                dialog?.dismiss()
            })

            val commandName = viewDialog.findViewById<EditText>(R.id.create_command_name)
            viewDialog.findViewById<Button>(R.id.accept_create_command).setOnClickListener(View.OnClickListener {
                if(commandName.text.toString().length < 3){
                    handleErrorMessage("Название команды должно состоять из трёх и более символов")
                    dialog?.dismiss()
                    return@OnClickListener
                }

                createTeam(commandName.text.toString())
                dialog?.dismiss()
            })
        }

        // Обработка результата запроса на создание новой команды
        viewModel.createTeamResponse.observe(viewLifecycleOwner) {
            binding.progressBar.visible(it is Resource.Loading)
            hideKeyboard()

            when (it) {
                // Обработка успешного сетевого взаимодействия
                is Resource.Success -> {
                    if (it.value.isSuccessful) {
                        val body = Gson().fromJson(it.value.body().toString(), TeamCreateRequestModel::class.java)

                        handleSuccessMessage("Команда \"${body.name}\" успешно создана!")
                    } else {
                        val error = Gson().fromJson(
                            it.value.errorBody()?.string().toString(), ErrorModel::class.java
                        )
                        handleErrorMessage(
                            if (error.errors != null && error.errors!!.isNotEmpty()) error.errors?.first()!!.msg
                            else error.message!!
                        )
                    }
                }

                // Обработка ошибок связанные с сетью
                is Resource.Failure -> {
                    handleApiError(it) { }
                }

                else -> {}
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
    ) = FragmentFindTeamBinding.inflate(inflater, container, false)

    /**
     * Метод получения репозитория данного фрагмента
     */
    override fun getFragmentRepository() =
        PlayerRepository(remoteDataSource.buildApi(PlayerApi::class.java, userPreferences, cookiePreferences))

    private fun createTeam(name: String) {
        viewModel.createTeam(
            TeamCreateModel(
                name = name
            )
        )
    }
}