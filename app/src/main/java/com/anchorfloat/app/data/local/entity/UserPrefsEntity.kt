package com.anchorfloat.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.anchorfloat.app.domain.model.EnergyLevel

@Entity(tableName = "user_prefs")
data class UserPrefsEntity(
    @PrimaryKey val id: Int = 1,
    val energy: EnergyLevel = EnergyLevel.GREEN,
    val lastSweepIso: String? = null,
    val focusedTaskId: Long? = null,
)
