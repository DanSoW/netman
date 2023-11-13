package com.main.netman.containers.game.adapters

import android.annotation.SuppressLint
import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.main.netman.containers.base.BaseAdapter
import com.main.netman.databinding.AdapterCommandItemBinding
import com.main.netman.databinding.AdapterCommandItemEasyBinding
import com.main.netman.models.command.CommandInfoModel

class CommandAdapter(
    private val context: Context,
    private var commands: ArrayList<CommandInfoModel>
) : BaseAdapter<CommandInfoModel, AdapterCommandItemEasyBinding>() {

    @SuppressLint("NotifyDataSetChanged")
    fun setCommands(commandsInput: ArrayList<CommandInfoModel>){
        commands.clear()
        commands = commandsInput
        notifyDataSetChanged()
    }

    override fun getAdapterBinding(parent: ViewGroup, viewType: Int): BaseViewHolder<AdapterCommandItemEasyBinding> {
        val binding = AdapterCommandItemEasyBinding.inflate(LayoutInflater.from(context), parent, false)

        return BaseViewHolder(binding)
    }

    @SuppressLint("SetTextI18n")
    override fun onBindViewHolder(holder: BaseViewHolder<AdapterCommandItemEasyBinding>, @SuppressLint(
        "RecyclerView"
    ) position: Int) {
        val command = commands[position]

        holder.binding.teamName.text = command.name
        holder.binding.countMembers.text = command.countMembers.toString()
        holder.binding.pgBarItem.visibility = View.GONE
    }

    override fun getItemCount(): Int {
        return commands.size
    }
}