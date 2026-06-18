const multer = require('multer')
const path = require('path')
const fs = require('fs')
const express = require('express')

const app = express()
const dir = path.join(__dirname, 'uploads/complaints')
fs.mkdirSync(dir, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  })
}).array('images', 5)

app.post('/test-upload', (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return res.json({ error: err.message })
    console.log('req.files:', req.files)
    console.log('req.body:', req.body)
    res.json({ files: req.files, body: req.body })
  })
})

app.listen(5001, () => console.log('Test server on 5001'))
