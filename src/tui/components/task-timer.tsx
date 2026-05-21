import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'

interface TaskTimerDisplayProps {
  startTime: number
  label?: string
}

export const TaskTimerDisplay: React.FC<TaskTimerDisplayProps> = ({ startTime, label }) => {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const totalSeconds = Math.floor(elapsed / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <Box>
      {label && <Text color="gray">{label} </Text>}
      <Text bold color="cyan">{formatted}</Text>
    </Box>
  )
}
