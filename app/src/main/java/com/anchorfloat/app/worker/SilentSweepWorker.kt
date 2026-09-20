package com.anchorfloat.app.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.anchorfloat.app.domain.repository.TimelineRepository
import com.anchorfloat.app.domain.time.TimeProvider
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

/**
 * Quiet local-midnight sweep. No notification, no badge, no shame copy.
 */
@HiltWorker
class SilentSweepWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: TimelineRepository,
    private val timeProvider: TimeProvider,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        repository.midnightSweep(timeProvider.today().toString())
        return Result.success()
    }

    companion object {
        const val UNIQUE_NAME = "silent_midnight_sweep"
    }
}
