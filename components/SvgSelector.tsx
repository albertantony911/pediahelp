import React, { useState, useEffect } from 'react'
import { Select } from '@sanity/ui'
import { FormField, StringInputProps } from 'sanity'
import { PatchEvent, set } from 'sanity'

interface SvgSelectorProps extends StringInputProps {
  name?: string
  title?: string
  description?: string
}

const SvgSelector: React.FC<SvgSelectorProps> = ({ name, title, value, onChange, description }) => {
  const [svgFiles, setSvgFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/waves')
      .then(res => res.json())
      .then(data => {
        if (data.files) {
          setSvgFiles(['', ...data.files]) // Include empty option for "None"
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('Error fetching SVG files:', err)
        setLoading(false)
      })
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value
    onChange(PatchEvent.from(set(newValue)))
  }

  return (
    <FormField title={title} description={description}>
      <Select
        value={value || ''}
        onChange={handleChange}
        disabled={loading}
      >
        <option value="">None</option>
        {svgFiles.filter(file => file !== '').map(file => (
          <option key={file} value={file}>
            {file}
          </option>
        ))}
      </Select>
    </FormField>
  )
}

export default SvgSelector