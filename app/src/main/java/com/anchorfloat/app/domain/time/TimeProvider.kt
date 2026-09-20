package com.anchorfloat.app.domain.time

import java.time.Clock
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

interface TimeProvider {
    fun today(): LocalDate
    fun localTime(): LocalTime
    fun zoneId(): ZoneId
}

class SystemTimeProvider(
    private val clock: Clock = Clock.systemDefaultZone(),
) : TimeProvider {
    override fun today(): LocalDate = LocalDate.now(clock)
    override fun localTime(): LocalTime = LocalTime.now(clock)
    override fun zoneId(): ZoneId = clock.zone
}
