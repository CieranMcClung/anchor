package com.anchorfloat.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.anchorfloat.app.data.local.entity.UserPrefsEntity
import com.anchorfloat.app.domain.model.EnergyLevel
import kotlinx.coroutines.flow.Flow

@Dao
interface PrefsDao {
    @Query("SELECT * FROM user_prefs WHERE id = 1")
    fun observe(): Flow<UserPrefsEntity?>

    @Query("SELECT * FROM user_prefs WHERE id = 1")
    suspend fun get(): UserPrefsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(prefs: UserPrefsEntity)

    @Query("UPDATE user_prefs SET energy = :energy WHERE id = 1")
    suspend fun setEnergy(energy: EnergyLevel)

    @Query("UPDATE user_prefs SET lastSweepIso = :iso WHERE id = 1")
    suspend fun setLastSweepIso(iso: String)

    @Query("UPDATE user_prefs SET focusedTaskId = :taskId WHERE id = 1")
    suspend fun setFocusedTaskId(taskId: Long?)
}
