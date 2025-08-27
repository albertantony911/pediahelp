// sanity/components/TimeSlotsInput.tsx
import React, {useMemo, useCallback} from 'react'
import {Box, Card, Flex, Inline, Text, Button, Menu, MenuButton, MenuItem, Stack} from '@sanity/ui'
import {set, unset, type Path} from 'sanity'

// 08:00 → 23:00 (hourly). Change here if you want 30m, etc.
const SLOT_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const hour = 8 + i
  return `${hour.toString().padStart(2, '0')}:00`
})

const WEEKDAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const
type WeekdayKey = typeof WEEKDAYS[number]

// Minimal props shape we actually use from Sanity input components
type Props = {
  value?: string[]
  onChange: (patch: unknown) => void
  path: Path
  schemaType: { title?: string }
}

/**
 * Time slot toggle grid for array<string> fields.
 * Enhancements:
 *  - Copy current day's selection to another weekday
 *  - Copy to all weekdays
 *  - Clear current day
 *
 * Works for appointment.weeklyAvailability.<weekday> and overrides[].partialSlots
 */
export default function TimeSlotsInput(props: Props) {
  const {value = [], onChange, schemaType, path} = props

  // Field name is the last segment of the path; for weeklyAvailability we’ll get the weekday key.
  const fieldKey = String(path[path.length - 1]) as string
  const isWeeklyDay = (WEEKDAYS as readonly string[]).includes(fieldKey)

  const selected = useMemo(() => new Set<string>(value), [value])

  const toggle = useCallback((slot: string) => {
    const next = new Set(selected)
    if (next.has(slot)) next.delete(slot)
    else next.add(slot)
    const arr = Array.from(next).sort()
    onChange(arr.length ? set(arr) : unset())
  }, [onChange, selected])

  // Patch helper to write into a sibling weekday path (…/weeklyAvailability/<day>)
  const setAtPath = useCallback((targetPath: Path, slots: string[]) => {
    onChange(slots.length ? set(slots, targetPath) : unset(targetPath))
  }, [onChange])

  const copyTo = useCallback((day: WeekdayKey) => {
    if (!isWeeklyDay) return
    const base = path.slice(0, -1) // …/weeklyAvailability
    const target = [...base, day]   // …/weeklyAvailability/day
    setAtPath(target, Array.from(selected).sort())
  }, [isWeeklyDay, path, selected, setAtPath])

  const copyToAll = useCallback(() => {
    if (!isWeeklyDay) return
    const base = path.slice(0, -1)
    const slots = Array.from(selected).sort()
    WEEKDAYS.forEach((day) => {
      const target = [...base, day]
      setAtPath(target, slots)
    })
  }, [isWeeklyDay, path, selected, setAtPath])

  const clearDay = useCallback(() => {
    onChange(unset())
  }, [onChange])

  return (
    <Stack space={3}>
      {/* Header row with actions */}
      <Flex align="center" justify="space-between">
        <Text size={1} weight="semibold">
          {schemaType.title || 'Time Slots'}
        </Text>

        {isWeeklyDay && (
          <Inline space={2}>
            <MenuButton
              id="copyToMenu"
              button={<Button mode="bleed" text="Copy to…" />}
              menu={
                <Menu>
                  {WEEKDAYS
                    .filter((d) => d !== fieldKey)
                    .map((d) => (
                      <MenuItem key={d} text={capitalize(d)} onClick={() => copyTo(d)} />
                    ))}
                </Menu>
              }
              popover={{constrainSize: true}}
            />
            <Button mode="bleed" text="Copy to all" onClick={copyToAll} />
            <Button tone="critical" mode="bleed" text="Clear" onClick={clearDay} />
          </Inline>
        )}
      </Flex>

      {/* Chip grid */}
      <Card padding={3} radius={3} tone="transparent" border>
        <Inline space={2}>
          {SLOT_OPTIONS.map((slot) => {
            const active = selected.has(slot)
            return (
              <Card
                key={slot}
                padding={2}
                radius={2}
                tone={active ? 'positive' : 'transparent'}
                border={!active}
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all .12s ease',
                }}
                onClick={() => toggle(slot)}
              >
                <Text size={1} weight={active ? 'semibold' : 'regular'}>
                  {slot}
                </Text>
              </Card>
            )
          })}
        </Inline>

        {Array.isArray(value) && value.length > 0 && (
          <Box marginTop={3}>
            <Text size={1} muted>
              Selected:&nbsp;<Text as="span">{value.join(', ')}</Text>
            </Text>
          </Box>
        )}
      </Card>
    </Stack>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}