package com.anchorfloat.app.data.local

import androidx.room.TypeConverter
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatSlot
import com.anchorfloat.app.domain.model.TaskStatus

class Converters {
    @TypeConverter
    fun toEnergy(raw: String?): EnergyLevel =
        raw?.let { runCatching { EnergyLevel.valueOf(it) }.getOrNull() } ?: EnergyLevel.GREEN

    @TypeConverter
    fun fromEnergy(value: EnergyLevel): String = value.name

    @TypeConverter
    fun toStatus(raw: String?): TaskStatus =
        raw?.let { runCatching { TaskStatus.valueOf(it) }.getOrNull() } ?: TaskStatus.PENDING

    @TypeConverter
    fun fromStatus(value: TaskStatus): String = value.name

    @TypeConverter
    fun toSlot(raw: String?): FloatSlot =
        raw?.let { runCatching { FloatSlot.valueOf(it) }.getOrNull() } ?: FloatSlot.POOL

    @TypeConverter
    fun fromSlot(value: FloatSlot): String = value.name
}
