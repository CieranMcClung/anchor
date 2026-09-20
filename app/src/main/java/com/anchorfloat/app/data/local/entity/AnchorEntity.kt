package com.anchorfloat.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "anchors",
    indices = [Index(value = ["sortOrder"])],
)
data class AnchorEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    /** Minutes from local midnight, e.g. 9:00 → 540. */
    val wallClockMinutes: Int,
    val sortOrder: Int,
    val isCore: Boolean,
    val isSurvivalMilestone: Boolean,
    val sensoryHint: String,
)
