// sanity/components/TimeSlotsAdapter.tsx
import React from 'react'
import type {ArrayOfPrimitivesInputProps, ArraySchemaType, Path} from 'sanity'
import TimeSlotsInput from './TimeSlotsInput'

type P = ArrayOfPrimitivesInputProps<string | number | boolean, ArraySchemaType<unknown>>

export default function TimeSlotsAdapter(props: P) {
  const {value, onChange, path, schemaType} = props

  // Only keep strings; ignore numbers/booleans if somehow present
  const safeValue = Array.isArray(value)
    ? (value.filter((v): v is string => typeof v === 'string'))
    : []

  // TimeSlotsInput already uses set/unset patches via onChange, so we can pass it straight through
  return (
    <TimeSlotsInput
      value={safeValue}
      onChange={onChange as (patch: unknown) => void}
      path={path as Path}
      schemaType={schemaType as {title?: string}}
    />
  )
}