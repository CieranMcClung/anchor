package com.anchorfloat.app.domain

import com.anchorfloat.app.domain.filter.EnergyVisibility
import com.anchorfloat.app.domain.model.Anchor
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatSlot
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.model.TaskStatus
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class EnergyVisibilityTest {

    private val boardEssential = task(
        id = 1,
        anchorId = 10,
        board = "2026-09-20",
        essential = true,
        light = true,
    )
    private val boardLight = task(
        id = 2,
        anchorId = 10,
        board = "2026-09-20",
        light = true,
    )
    private val boardOptional = task(
        id = 3,
        anchorId = 10,
        board = "2026-09-20",
    )
    private val boardHighStakes = task(
        id = 4,
        anchorId = 10,
        board = "2026-09-20",
        high = true,
    )
    private val poolOptional = task(id = 5, anchorId = null, board = null, slot = FloatSlot.POOL)
    private val poolEssential = task(
        id = 6,
        anchorId = null,
        board = null,
        slot = FloatSlot.POOL,
        essential = true,
    )
    private val done = boardLight.copy(id = 7, status = TaskStatus.DONE)

    @Test
    fun greenShowsScheduledAndQueued() {
        EnergyLevel.GREEN.let { energy ->
            assertTrue(EnergyVisibility.isTaskVisible(boardOptional, energy))
            assertTrue(EnergyVisibility.isTaskVisible(poolOptional, energy))
            assertTrue(EnergyVisibility.isTaskVisible(boardEssential, energy))
            assertFalse(EnergyVisibility.isTaskVisible(done, energy))
        }
    }

    @Test
    fun amberHidesNonEssentialBacklogAndOptionalBoardFloats() {
        EnergyLevel.AMBER.let { energy ->
            assertTrue(EnergyVisibility.isTaskVisible(boardLight, energy))
            assertTrue(EnergyVisibility.isTaskVisible(boardEssential, energy))
            assertTrue(EnergyVisibility.isTaskVisible(boardHighStakes, energy))
            assertTrue(EnergyVisibility.isTaskVisible(poolEssential, energy))
            assertFalse(EnergyVisibility.isTaskVisible(boardOptional, energy))
            assertFalse(EnergyVisibility.isTaskVisible(poolOptional, energy))
        }
    }

    @Test
    fun redShowsOnlySurvivalAndHighConsequence() {
        EnergyLevel.RED.let { energy ->
            assertTrue(EnergyVisibility.isTaskVisible(boardEssential, energy))
            assertTrue(EnergyVisibility.isTaskVisible(boardHighStakes, energy))
            assertTrue(EnergyVisibility.isTaskVisible(poolEssential, energy))
            assertFalse(EnergyVisibility.isTaskVisible(boardLight, energy))
            assertFalse(EnergyVisibility.isTaskVisible(boardOptional, energy))
            assertFalse(EnergyVisibility.isTaskVisible(poolOptional, energy))
        }
    }

    @Test
    fun redKeepsSurvivalAnchorsEvenWithoutChildren() {
        val lunch = Anchor(
            id = 2,
            title = "Lunch",
            wallClockMinutes = 13 * 60,
            sortOrder = 1,
            isCore = true,
            isSurvivalMilestone = true,
            sensoryHint = "Eat something.",
        )
        assertTrue(EnergyVisibility.isAnchorVisible(lunch, emptyList(), EnergyLevel.RED))
    }

    private fun task(
        id: Long,
        anchorId: Long?,
        board: String?,
        slot: FloatSlot = if (anchorId == null) FloatSlot.POOL else FloatSlot.AFTER,
        essential: Boolean = false,
        high: Boolean = false,
        light: Boolean = false,
    ) = FloatTask(
        id = id,
        title = "task-$id",
        note = "",
        anchorId = anchorId,
        untilAnchorId = null,
        floatSlot = slot,
        sortOrder = id.toInt(),
        status = TaskStatus.PENDING,
        isEssential = essential,
        isHighConsequence = high,
        isLightweight = light,
        boardDateIso = board,
    )
}
