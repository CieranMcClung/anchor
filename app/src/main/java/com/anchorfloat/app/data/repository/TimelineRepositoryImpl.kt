package com.anchorfloat.app.data.repository

import androidx.room.withTransaction
import com.anchorfloat.app.data.local.AppDatabase
import com.anchorfloat.app.data.local.dao.AnchorDao
import com.anchorfloat.app.data.local.dao.PrefsDao
import com.anchorfloat.app.data.local.dao.TaskDao
import com.anchorfloat.app.data.local.entity.TaskEntity
import com.anchorfloat.app.data.local.entity.UserPrefsEntity
import com.anchorfloat.app.data.local.seed.SeedData
import com.anchorfloat.app.data.mapper.toDomain
import com.anchorfloat.app.di.IoDispatcher
import com.anchorfloat.app.domain.model.Anchor
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.model.TaskStatus
import com.anchorfloat.app.domain.model.UserPrefs
import com.anchorfloat.app.domain.repository.TimelineRepository
import com.anchorfloat.app.domain.unstuck.UnstuckCatalog
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TimelineRepositoryImpl @Inject constructor(
    private val db: AppDatabase,
    private val anchorDao: AnchorDao,
    private val taskDao: TaskDao,
    private val prefsDao: PrefsDao,
    @IoDispatcher private val io: CoroutineDispatcher,
) : TimelineRepository {

    override fun observePrefs(): Flow<UserPrefs> =
        prefsDao.observe().map { it.toDomain() }

    override fun observeAnchors(): Flow<List<Anchor>> =
        anchorDao.observeAll().map { list -> list.map { it.toDomain() } }

    override fun observeVisibleTasks(energy: EnergyLevel): Flow<List<FloatTask>> =
        taskDao.observeVisible(energy).map { list -> list.map { it.toDomain() } }

    override fun observeAllOpenTasks(): Flow<List<FloatTask>> =
        taskDao.observeOpen().map { list -> list.map { it.toDomain() } }

    override suspend fun ensureReady(todayIso: String) = withContext(io) {
        SeedData.insertIfEmpty(todayIso, anchorDao, taskDao, prefsDao)
        if (prefsDao.get() == null) {
            prefsDao.upsert(UserPrefsEntity(lastSweepIso = todayIso))
        }
        midnightSweep(todayIso)
    }

    override suspend fun setEnergy(energy: EnergyLevel) = withContext(io) {
        prefsDao.setEnergy(energy)
    }

    override suspend fun setFocusedTask(taskId: Long?) = withContext(io) {
        prefsDao.setFocusedTaskId(taskId)
    }

    override suspend fun completeTask(taskId: Long) = withContext(io) {
        taskDao.updateStatus(taskId, TaskStatus.DONE)
        val prefs = prefsDao.get()
        if (prefs?.focusedTaskId == taskId) {
            prefsDao.setFocusedTaskId(null)
        }
    }

    override suspend fun startTask(taskId: Long) = withContext(io) {
        val current = taskDao.getById(taskId) ?: return@withContext
        if (current.status == TaskStatus.DONE) return@withContext
        taskDao.updateStatus(taskId, TaskStatus.IN_PROGRESS)
        prefsDao.setFocusedTaskId(taskId)
    }

    override suspend fun breakSmaller(taskId: Long): Long? = withContext(io) {
        val current = taskDao.getById(taskId) ?: return@withContext null
        db.withTransaction {
            val insertAt = current.sortOrder
            taskDao.shiftSortFrom(insertAt)
            val micro = TaskEntity(
                title = UnstuckCatalog.smallerTitle(current.toDomain()),
                note = "A smaller piece. Stopping is allowed.",
                anchorId = current.anchorId,
                untilAnchorId = current.untilAnchorId,
                floatSlot = current.floatSlot,
                sortOrder = insertAt,
                status = TaskStatus.PENDING,
                isEssential = current.isEssential,
                isHighConsequence = false,
                isLightweight = true,
                boardDateIso = current.boardDateIso,
            )
            val id = taskDao.insert(micro)
            prefsDao.setFocusedTaskId(id)
            id
        }
    }

    override suspend fun swapTask(taskId: Long, visibleIds: List<Long>): Long? = withContext(io) {
        val alternatives = visibleIds.filter { it != taskId }
        val nextId = alternatives.firstOrNull() ?: return@withContext null
        val current = taskDao.getById(taskId)
        if (current != null && current.status == TaskStatus.IN_PROGRESS) {
            taskDao.updateStatus(taskId, TaskStatus.PENDING)
        }
        taskDao.updateStatus(nextId, TaskStatus.IN_PROGRESS)
        prefsDao.setFocusedTaskId(nextId)
        nextId
    }

    override suspend fun midnightSweep(todayIso: String) = withContext(io) {
        db.withTransaction {
            val last = prefsDao.get()?.lastSweepIso
            if (last == todayIso) return@withTransaction
            taskDao.midnightSweep(todayIso)
            prefsDao.setLastSweepIso(todayIso)
        }
    }
}
