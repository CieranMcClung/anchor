package com.anchorfloat.app.domain.repository

import com.anchorfloat.app.domain.model.Anchor
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.model.UserPrefs
import kotlinx.coroutines.flow.Flow

interface TimelineRepository {
    fun observePrefs(): Flow<UserPrefs>
    fun observeAnchors(): Flow<List<Anchor>>
    fun observeVisibleTasks(energy: EnergyLevel): Flow<List<FloatTask>>
    fun observeAllOpenTasks(): Flow<List<FloatTask>>

    suspend fun ensureReady(todayIso: String)
    suspend fun setEnergy(energy: EnergyLevel)
    suspend fun setFocusedTask(taskId: Long?)
    suspend fun completeTask(taskId: Long)
    suspend fun startTask(taskId: Long)
    suspend fun breakSmaller(taskId: Long): Long?
    suspend fun swapTask(taskId: Long, visibleIds: List<Long>): Long?
    suspend fun midnightSweep(todayIso: String)
}
