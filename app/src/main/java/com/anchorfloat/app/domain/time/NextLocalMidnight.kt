package com.anchorfloat.app.domain.time

import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId

object NextLocalMidnight {
    fun millisUntil(
        zoneId: ZoneId,
        now: LocalDateTime = LocalDateTime.now(zoneId),
    ): Long {
        var next = LocalDateTime.of(LocalDate.from(now), LocalTime.MIDNIGHT)
        if (!now.isBefore(next)) {
            next = next.plusDays(1)
        }
        return Duration.between(now, next).toMillis().coerceAtLeast(1L)
    }
}
