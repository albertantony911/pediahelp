import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const wavesDir = path.join(process.cwd(), 'public', 'waves')
  try {
    const files = fs.readdirSync(wavesDir).filter(file => file.endsWith('.svg'))
    res.status(200).json({ files })
  } catch (error) {
    console.error('Error reading waves directory:', error)
    res.status(500).json({ error: 'Failed to read SVG files' })
  }
}