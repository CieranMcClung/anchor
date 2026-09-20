package com.anchorfloat.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.anchorfloat.app.data.local.entity.TaskEntity
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatSlot
import com.anchorfloat.app.domain.model.TaskStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {

    @Query(
        """
        SELECT * FROM tasks
        WHERE status IN ('PENDING', 'IN_PROGRESS', 'SWEPT_TO_BACKLOG')
        ORDER BY sortOrder ASC, id ASC
        """,
    )
    fun observeOpen(): Flow<List<TaskEntity>>

    /**
     * Energy filter logic (mirrors [com.anchorfloat.app.domain.filter.EnergyVisibility]):
     * GREEN — all open scheduled + queued tasks.
     * AMBER — board floats that are lightweight, essential, or high-consequence;
     *         pool items only if essential. Non-essential backlog is hidden.
     * RED — essential survival work and high-consequence deadlines only.
     */
    @Query(
        """
        SELECT * FROM tasks
        WHERE status IN ('PENDING', 'IN_PROGRESS', 'SWEPT_TO_BACKLOG')
          AND (
            CASE :energy
              WHEN 'GREEN' THEN 1
              WHEN 'AMBER' THEN CASE
                WHEN anchorId IS NOT NULL
                     AND boardDateIso IS NOT NULL
                     AND (isLightweight = 1 OR isEssential = 1 OR isHighConsequence = 1) THEN 1
                WHEN (anchorId IS NULL OR floatSlot = 'POOL')
                     AND isEssential = 1 THEN 1
                ELSE 0
              END
              WHEN 'RED' THEN CASE
                WHEN isEssential = 1 OR isHighConsequence = 1 THEN 1
                ELSE 0
              END
              ELSE 0
            END = 1
          )
        ORDER BY
          CASE WHEN anchorId IS NULL THEN 1 ELSE 0 END,
          sortOrder ASC,
          id ASC
        """,
    )
    fun observeVisible(energy: EnergyLevel): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE id = :id LIMIT 1")
    suspend fun getById(id: Long): TaskEntity?

    @Query("SELECT COALESCE(MAX(sortOrder), 0) FROM tasks")
    suspend fun maxSortOrder(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: TaskEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<TaskEntity>): List<Long>

    @Update
    suspend fun update(task: TaskEntity)

    @Query("UPDATE tasks SET status = :status WHERE id = :id")
    suspend fun updateStatus(id: Long, status: TaskStatus)

    @Query("UPDATE tasks SET sortOrder = sortOrder + 1 WHERE sortOrder >= :from")
    suspend fun shiftSortFrom(from: Int)

    @Query(
        """
        UPDATE tasks SET
          anchorId = NULL,
          untilAnchorId = NULL,
          floatSlot = :pool,
          boardDateIso = NULL,
          status = :swept
        WHERE boardDateIso IS NOT NULL
          AND boardDateIso < :todayIso
          AND status IN ('PENDING', 'IN_PROGRESS')
        """,
    )
    suspend fun sweepUncheckedToBacklog(
        todayIso: String,
        pool: FloatSlot = FloatSlot.POOL,
        swept: TaskStatus = TaskStatus.SWEPT_TO_BACKLOG,
    ): Int

    @Query(
        """
        UPDATE tasks SET boardDateIso = NULL
        WHERE boardDateIso IS NOT NULL
          AND boardDateIso < :todayIso
          AND status = 'DONE'
        """,
    )
    suspend fun clearCompletedFromBoard(todayIso: String): Int

    @Query("SELECT COUNT(*) FROM tasks")
    suspend fun count(): Int

    @Transaction
    suspend fun midnightSweep(todayIso: String) {
        sweepUncheckedToBacklog(todayIso)
        clearCompletedFromBoard(todayIso)
    }
}
