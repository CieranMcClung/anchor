package com.anchorfloat.app.data.mapper

import com.anchorfloat.app.data.local.entity.AnchorEntity
import com.anchorfloat.app.data.local.entity.TaskEntity
import com.anchorfloat.app.data.local.entity.UserPrefsEntity
import com.anchorfloat.app.domain.model.Anchor
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.model.UserPrefs

fun AnchorEntity.toDomain(): Anchor = Anchor(
    id = id,
    title = title,
    wallClockMinutes = wallClockMinutes,
    sortOrder = sortOrder,
    isCore = isCore,
    isSurvivalMilestone = isSurvivalMilestone,
    sensoryHint = sensoryHint,
)

fun TaskEntity.toDomain(): FloatTask = FloatTask(
    id = id,
    title = title,
    note = note,
    anchorId = anchorId,
    untilAnchorId = untilAnchorId,
    floatSlot = floatSlot,
    sortOrder = sortOrder,
    status = status,
    isEssential = isEssential,
    isHighConsequence = isHighConsequence,
    isLightweight = isLightweight,
    boardDateIso = boardDateIso,
)

fun UserPrefsEntity?.toDomain(): UserPrefs = UserPrefs(
    energy = this?.energy ?: EnergyLevel.GREEN,
    lastSweepIso = this?.lastSweepIso,
    focusedTaskId = this?.focusedTaskId,
)
