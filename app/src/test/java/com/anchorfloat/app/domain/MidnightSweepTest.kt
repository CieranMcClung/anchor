package com.anchorfloat.app.domain

import com.anchorfloat.app.domain.model.FloatSlot
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.model.TaskStatus
import com.anchorfloat.app.domain.sweep.MidnightSweep
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MidnightSweepTest {

    @Test
    fun uncheckedFloatsMoveToPoolWithoutOverdueState() {
        val open = sample(id = 1, status = TaskStatus.PENDING, board = "2026-09-19", anchorId = 4)
        val inHand = sample(id = 2, status = TaskStatus.IN_PROGRESS, board = "2026-09-19", anchorId = 4)
        val result = MidnightSweep.apply(listOf(open, inHand), todayIso = "2026-09-20")

        result.forEach { task ->
            assertEquals(TaskStatus.SWEPT_TO_BACKLOG, task.status)
            assertEquals(FloatSlot.POOL, task.floatSlot)
            assertNull(task.anchorId)
            assertNull(task.boardDateIso)
        }
    }

    @Test
    fun completedItemsLeaveTheBoardQuietly() {
        val done = sample(id = 3, status = TaskStatus.DONE, board = "2026-09-19", anchorId = 4)
        val swept = MidnightSweep.apply(listOf(done), "2026-09-20").single()
        assertEquals(TaskStatus.DONE, swept.status)
        assertNull(swept.boardDateIso)
    }

    @Test
    fun todayBoardIsUntouched() {
        val today = sample(id = 4, status = TaskStatus.PENDING, board = "2026-09-20", anchorId = 8)
        val swept = MidnightSweep.apply(listOf(today), "2026-09-20").single()
        assertEquals(today, swept)
    }

    private fun sample(
        id: Long,
        status: TaskStatus,
        board: String?,
        anchorId: Long?,
    ) = FloatTask(
        id = id,
        title = "float",
        note = "",
        anchorId = anchorId,
        untilAnchorId = null,
        floatSlot = FloatSlot.AFTER,
        sortOrder = 1,
        status = status,
        isEssential = false,
        isHighConsequence = false,
        isLightweight = true,
        boardDateIso = board,
    )
}
