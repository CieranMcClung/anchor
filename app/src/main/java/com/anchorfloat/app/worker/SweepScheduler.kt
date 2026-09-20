package com.anchorfloat.app.worker

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.anchorfloat.app.domain.time.NextLocalMidnight
import java.time.ZoneId
import java.util.concurrent.TimeUnit

object SweepScheduler {

    fun schedule(context: Context, zoneId: ZoneId = ZoneId.systemDefault()) {
        val request = PeriodicWorkRequestBuilder<SilentSweepWorker>(1, TimeUnit.DAYS)
            .setInitialDelay(NextLocalMidnight.millisUntil(zoneId), TimeUnit.MILLISECONDS)
            .addTag(SilentSweepWorker.UNIQUE_NAME)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            SilentSweepWorker.UNIQUE_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
    }
}
