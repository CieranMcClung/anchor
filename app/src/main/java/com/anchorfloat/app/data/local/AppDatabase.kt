package com.anchorfloat.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.anchorfloat.app.data.local.dao.AnchorDao
import com.anchorfloat.app.data.local.dao.PrefsDao
import com.anchorfloat.app.data.local.dao.TaskDao
import com.anchorfloat.app.data.local.entity.AnchorEntity
import com.anchorfloat.app.data.local.entity.TaskEntity
import com.anchorfloat.app.data.local.entity.UserPrefsEntity

@Database(
    entities = [
        AnchorEntity::class,
        TaskEntity::class,
        UserPrefsEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun anchorDao(): AnchorDao
    abstract fun taskDao(): TaskDao
    abstract fun prefsDao(): PrefsDao

    companion object {
        const val NAME = "anchor_float.db"
    }
}
