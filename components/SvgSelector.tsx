import React, { useState, useEffect } from 'react'
import { Select } from '@sanity/ui'
import { FormField, StringInputProps, useClient } from 'sanity'
import { PatchEvent, set } from 'sanity'

interface SvgSelectorProps extends StringInputProps {
  name?: string
  title?: string
  description?: string
}

const SvgSelector: React.FC<SvgSelectorProps> = ({ name, title, value, onChange, description }) => {
  const [svgFiles, setSvgFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const client = useClient({ apiVersion: '2023-05-03' }) // Adjust API version as needed

  useEffect(() => {
    client
      .fetch(
        `*[_type == "waveSvgs"][0].svgs`,
        {},
        { perspective: 'previewDrafts' } // Use 'published' if not using drafts
      )
      .then((svgs: string[]) => {
        if (svgs && svgs.length > 0) {
          setSvgFiles(['', ...svgs])
          setError(null)
        } else {
          setError('No SVG files found in Sanity')
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching SVG files from Sanity:', err)
        setError('Failed to load SVGs: ' + err.message)
        setLoading(false)
      })
  }, [client])

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
        {error ? (
          <option value="" disabled>
            {error}
          </option>
        ) : (
          svgFiles.filter(file => file !== '').map(file => (
            <option key={file} value={file}>
              {file}
            </option>
          ))
        )}
      </Select>
    </FormField>
  )
}

export default SvgSelector