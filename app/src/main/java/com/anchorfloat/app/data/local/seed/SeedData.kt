package com.anchorfloat.app.data.local.seed

import com.anchorfloat.app.data.local.dao.AnchorDao
import com.anchorfloat.app.data.local.dao.PrefsDao
import com.anchorfloat.app.data.local.dao.TaskDao
import com.anchorfloat.app.data.local.entity.AnchorEntity
import com.anchorfloat.app.data.local.entity.TaskEntity
import com.anchorfloat.app.data.local.entity.UserPrefsEntity
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatSlot
import com.anchorfloat.app.domain.model.TaskStatus

/**
 * First-run sample board so the timeline is never an empty void.
 * Copy is calm and adult — no streaks, no "don't forget".
 */
object SeedData {

    suspend fun insertIfEmpty(
        todayIso: String,
        anchorDao: AnchorDao,
        taskDao: TaskDao,
        prefsDao: PrefsDao,
    ) {
        if (anchorDao.count() > 0) return

        val ids = anchorDao.insertAll(
            listOf(
                AnchorEntity(
                    title = "Morning landing",
                    wallClockMinutes = 8 * 60,
                    sortOrder = 0,
                    isCore = true,
                    isSurvivalMilestone = true,
                    sensoryHint = "Feel both feet on the floor. Unclench your jaw if it is tight.",
                ),
                AnchorEntity(
                    title = "Work shift",
                    wallClockMinutes = 9 * 60,
                    sortOrder = 1,
                    isCore = true,
                    isSurvivalMilestone = false,
                    sensoryHint = "A slow stretch, then look at the first surface you will use.",
                ),
                AnchorEntity(
                    title = "Lunch",
                    wallClockMinutes = 13 * 60,
                    sortOrder = 2,
                    isCore = true,
                    isSurvivalMilestone = true,
                    sensoryHint = "Something to eat. Sitting down counts.",
                ),
                AnchorEntity(
                    title = "Wind-down",
                    wallClockMinutes = 18 * 60,
                    sortOrder = 3,
                    isCore = false,
                    isSurvivalMilestone = false,
                    sensoryHint = "Dim a light, or put a hand on your chest for two breaths.",
                ),
            ),
        )
        val morning = ids[0]
        val work = ids[1]
        val lunch = ids[2]
        val windDown = ids[3]

        taskDao.insertAll(
            listOf(
                TaskEntity(
                    title = "Drink a glass of water",
                    note = "That’s a full step.",
                    anchorId = morning,
                    floatSlot = FloatSlot.BEFORE,
                    sortOrder = 10,
                    status = TaskStatus.PENDING,
                    isEssential = true,
                    isLightweight = true,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "Take morning meds, if you use them",
                    note = "No rush. Log it in your own way.",
                    anchorId = morning,
                    floatSlot = FloatSlot.BEFORE,
                    sortOrder = 20,
                    status = TaskStatus.PENDING,
                    isEssential = true,
                    isLightweight = true,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "Put both feet on the floor",
                    note = "Just that.",
                    anchorId = morning,
                    floatSlot = FloatSlot.AFTER,
                    sortOrder = 30,
                    status = TaskStatus.PENDING,
                    isLightweight = true,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "Open the laptop lid",
                    note = "Opening it is enough to start.",
                    anchorId = work,
                    floatSlot = FloatSlot.BEFORE,
                    sortOrder = 40,
                    status = TaskStatus.PENDING,
                    isLightweight = true,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "The one message that actually matters",
                    note = "High-stakes, not urgent-red. Send or park — both are fine.",
                    anchorId = work,
                    floatSlot = FloatSlot.AFTER,
                    sortOrder = 50,
                    status = TaskStatus.PENDING,
                    isHighConsequence = true,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "Tidy the desktop icons — optional",
                    note = "Nice-to-have. Hidden when energy is lower.",
                    anchorId = work,
                    floatSlot = FloatSlot.AFTER,
                    sortOrder = 60,
                    status = TaskStatus.PENDING,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "Refill water on the way",
                    note = "Between work and lunch. No clock on this.",
                    anchorId = work,
                    untilAnchorId = lunch,
                    floatSlot = FloatSlot.BETWEEN,
                    sortOrder = 70,
                    status = TaskStatus.PENDING,
                    isEssential = true,
                    isLightweight = true,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "Eat something with a bit of protein",
                    note = "A snack counts.",
                    anchorId = lunch,
                    floatSlot = FloatSlot.BEFORE,
                    sortOrder = 80,
                    status = TaskStatus.PENDING,
                    isEssential = true,
                    isLightweight = true,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "Step outside for a minute",
                    note = "If you can. The doorway counts.",
                    anchorId = lunch,
                    floatSlot = FloatSlot.AFTER,
                    sortOrder = 90,
                    status = TaskStatus.PENDING,
                    isLightweight = true,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "Plug in the phone",
                    note = "A quiet close. Flow-only.",
                    anchorId = windDown,
                    floatSlot = FloatSlot.AFTER,
                    sortOrder = 100,
                    status = TaskStatus.PENDING,
                    boardDateIso = todayIso,
                ),
                TaskEntity(
                    title = "Sort the junk drawer",
                    note = "In the pool. Not on a clock.",
                    floatSlot = FloatSlot.POOL,
                    sortOrder = 200,
                    status = TaskStatus.PENDING,
                ),
                TaskEntity(
                    title = "Text the dentist back",
                    note = "High-consequence, no due-date shame. Whenever you can.",
                    floatSlot = FloatSlot.POOL,
                    sortOrder = 210,
                    status = TaskStatus.PENDING,
                    isHighConsequence = true,
                ),
                TaskEntity(
                    title = "Lay out tomorrow’s clothes",
                    note = "Optional. Skip without comment.",
                    floatSlot = FloatSlot.POOL,
                    sortOrder = 220,
                    status = TaskStatus.PENDING,
                ),
            ),
        )

        prefsDao.upsert(
            UserPrefsEntity(
                id = 1,
                energy = EnergyLevel.GREEN,
                lastSweepIso = todayIso,
                focusedTaskId = null,
            ),
        )
    }
}
