/* global preloadImagesTmr fxhash fxrand noise paper1Loaded */

//
//  fxhash - Hexagones Landscape
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

const ratio = 5 / 4
// const startTime = new Date().getTime() // so we can figure out how long since the scene started
let drawn = false
let highRes = false // display high or low res
let drawPaper = true
let full = false
const features = {}
const nextFrame = null
let resizeTmr = null

window.$fxhashFeatures = {}

const RED = '#ea2530'
const GREEN = '#64b852'
const BLUE = '#3c539d'
const CYAN = '#6dcbdb'
const YELLOW = '#f2e643'
const MAGENTA = '#b64f98'
const BLACK = '#000000'
const RGBCYM = [RED, GREEN, BLUE, CYAN, MAGENTA, YELLOW]

const hexToRgb = (hex) => {
  const result = /([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

const rgbToHsl = (rgb) => {
  rgb.r /= 255
  rgb.g /= 255
  rgb.b /= 255
  const max = Math.max(rgb.r, rgb.g, rgb.b)
  const min = Math.min(rgb.r, rgb.g, rgb.b)
  let h
  let s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rgb.r:
        h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6 : 0)
        break
      case rgb.g:
        h = (rgb.b - rgb.r) / d + 2
        break
      case rgb.b:
        h = (rgb.r - rgb.g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  }
}

//  Work out what all our features are
const makeFeatures = () => {
  // features.background = 1
  features.paperOffset = {
    paper1: {
      x: fxrand(),
      y: fxrand()
    },
    paper2: {
      x: fxrand(),
      y: fxrand()
    }
  }

  // THIS IS A VERY BAD WAY OF PLACING THE HEXAGONS, DON'T DO THIS!!!!

  // We want somewhere to store all the hexagon co-ordiantes
  features.hexagons = []
  //  We want to have a randome number of hexagons visible across the screen,
  //  we'll base everything else of this number
  let baseHexCount = Math.floor((fxrand() * 10 + 6) / 2) * 2
  baseHexCount = 10
  baseHexCount *= 2
  //  Now we know we want 3 times that many hexagons in the x direction
  const maxHexAcross = baseHexCount * 3
  // And 3 times and the ratio of the screen in the y direction
  const maxHexDown = baseHexCount * 7 * ratio
  // Store them so we know how many we have later
  features.maxHexAcross = maxHexAcross
  features.maxHexDown = maxHexDown
  //   Now loop throught them creating the hexagons, but we want to start
  // with negative values so it's all centered on 0,0
  let xCount = 0
  for (let x = -maxHexAcross / 2; x <= maxHexAcross / 2; x++) {
    let isEven = false
    for (let y = -maxHexDown / 2; y <= maxHexDown / 2; y++) {
      // Grab the x and y co-ords
      let xVal = x
      let yVal = y
      // convert the xVall and yVal into hexagon co-ordinates
      // If the yVal is odd, then we need to offset the xVal by 0.5
      if (isEven) xVal += 0.5
      //   Now convert them into ratio
      xVal /= (maxHexAcross / 2)
      yVal /= (maxHexDown / 6) * ratio
      // The yVal needs to be modified to get them to align into the hex grid properly
      yVal *= 0.8660254037844386
      // Now feed them into the features.hexagons array
      const hex = {
        x: xVal,
        y: yVal,
        colour: 'red'
      }
      if (isEven && xCount % 3 === 0) hex.colour = 'blue'
      if (!isEven && (xCount + 1) % 3 === 0) hex.colour = 'blue'
      features.hexagons.push(hex)
      isEven = !isEven
    }
    xCount++
  }

  // Work out the distance between the hexagons
  // Grab the middle hexagon
  const middleHexIndex = Math.floor(features.hexagons.length / 2)
  // Work out the one diagonally to the left
  const xDistance = Math.abs(features.hexagons[middleHexIndex].x - features.hexagons[middleHexIndex - 1].x)
  const yDistance = Math.abs(features.hexagons[middleHexIndex].y - features.hexagons[middleHexIndex - 1].y)
  // Work out the side difference
  const sideDistance = Math.abs(features.hexagons[middleHexIndex].x - features.hexagons[middleHexIndex - maxHexDown - 1].x)
  const newHexagons = []

  //  Now we want to loop through the hexagons and work the edge points

  features.xOffset = fxrand() * 1000
  features.yOffset = fxrand() * 1000
  for (let i = 0; i < features.hexagons.length; i++) {
    const hex = features.hexagons[i]
    if (hex.colour === 'blue') {
      hex.points = {}
      hex.points.topLeft = {
        x: hex.x - xDistance,
        y: hex.y - yDistance
      }
      hex.points.topRight = {
        x: hex.x + xDistance,
        y: hex.y - yDistance
      }
      hex.points.right = {
        x: hex.x + sideDistance,
        y: hex.y
      }
      hex.points.bottomRight = {
        x: hex.x + xDistance,
        y: hex.y + yDistance
      }
      hex.points.bottomLeft = {
        x: hex.x - xDistance,
        y: hex.y + yDistance
      }
      hex.points.left = {
        x: hex.x - sideDistance,
        y: hex.y
      }

      //   Lets set a random height for the hexagon
      // Work out the height based on noise
      // hex.height = (noise.perlin2(hex.x * 4 + xOffset, hex.y * 4 + yOffset) + 1) / 2
      hex.lightColour = '#FCF3E8'
      hex.darkColour = rgbToHsl(hexToRgb(RGBCYM[Math.floor(fxrand() * RGBCYM.length)]))
      newHexagons.push(hex)
    }
  }

  features.hexagons = newHexagons

  //  Now loop through all the hexagons rotating the points a small amount
  const squish = 0.5
  for (let i = 0; i < features.hexagons.length; i++) {
    const hex = features.hexagons[i]
    const newAngle = 15 * Math.PI / 180
    // Rotate the hex x and y points around 0,0 by the angle
    const newX = (Math.cos(newAngle) * hex.x) + (Math.sin(newAngle) * hex.y)
    const newY = (Math.cos(newAngle) * hex.y) - (Math.sin(newAngle) * hex.x)
    hex.x = newX
    hex.y = newY
    hex.y *= squish

    // Rotate all the points
    for (const point in hex.points) {
      const newX = (Math.cos(newAngle) * hex.points[point].x) + (Math.sin(newAngle) * hex.points[point].y)
      const newY = (Math.cos(newAngle) * hex.points[point].y) - (Math.sin(newAngle) * hex.points[point].x)
      hex.points[point].x = newX
      hex.points[point].y = newY
      hex.points[point].y *= squish
    }
  }

  // Now sort the hexagones by the y value from lowest to highest
  features.hexagons.sort((a, b) => {
    return a.y - b.y
  })
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()
console.table(window.$fxhashFeatures)

const init = async () => {
  //  I should add a timer to this, but really how often to people who aren't
  //  the developer resize stuff all the time. Stick it in a digital frame and
  //  have done with it!
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    await layoutCanvas()
    //  And redraw it
    drawCanvas()
  })

  //  Now layout the canvas
  await layoutCanvas()
}

const layoutCanvas = async () => {
  //  Kill the next animation frame
  window.cancelAnimationFrame(nextFrame)

  const wWidth = window.innerWidth
  const wHeight = window.innerHeight
  let cWidth = wWidth
  let cHeight = cWidth * ratio
  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }
  const canvas = document.getElementById('target')
  if (highRes) {
    canvas.height = 8192
    canvas.width = 8192 / ratio
  } else {
    canvas.width = Math.min((8192 / 2), cWidth * 2)
    canvas.height = Math.min((8192 / ratio / 2), cHeight * 2)
    //  Minimum size to be half of the high rez cersion
    if (Math.min(canvas.width, canvas.height) < 8192 / 2) {
      if (canvas.width < canvas.height) {
        canvas.height = 8192 / 2
        canvas.width = 8192 / 2 / ratio
      } else {
        canvas.width = 8192 / 2
        canvas.height = 8192 / 2 / ratio
      }
    }
  }

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  //  Re-Create the paper pattern
  const paper1 = document.createElement('canvas')
  paper1.width = canvas.width / 2
  paper1.height = canvas.height / 2
  const paper1Ctx = paper1.getContext('2d')
  await paper1Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper1.width, paper1.height)
  features.paper1Pattern = paper1Ctx.createPattern(paper1, 'repeat')

  const paper2 = document.createElement('canvas')
  paper2.width = canvas.width / (22 / 7)
  paper2.height = canvas.height / (22 / 7)
  const paper2Ctx = paper2.getContext('2d')
  await paper2Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper2.width, paper2.height)
  features.paper2Pattern = paper2Ctx.createPattern(paper2, 'repeat')

  //  And draw it!!
  drawCanvas()
}

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawn = true
  //  Make sure there's only one nextFrame to be called
  window.cancelAnimationFrame(nextFrame)

  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  //  Lay down the paper texture
  if (drawPaper) {
    ctx.fillStyle = features.paper1Pattern
    ctx.save()
    ctx.translate(-w * features.paperOffset.paper1.x, -h * features.paperOffset.paper1.y)
    ctx.fillRect(0, 0, w * 2, h * 2)
    ctx.restore()
  } else {
    ctx.fillStyle = '#F9F9F9'
    ctx.fillRect(0, 0, w, h)
  }

  // Here is the maximum height a hexagon can be
  const maxHeight = h / 2

  // set the fill style to red
  // Set the origin to the middle of the canvas
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.lineJoin = 'round'
  //  Draw the hexagons
  for (let i = 0; i < features.hexagons.length; i++) {
    const hex = features.hexagons[i]
    ctx.fillStyle = hex.lightColour

    hex.height = (noise.perlin3(hex.x * 4 + features.xOffset, hex.y * 4 + features.yOffset, new Date().getTime() / 2000) + 1) / 2

    // Draw the left of the hexagon
    ctx.beginPath()
    ctx.moveTo(w * hex.points.bottomLeft.x, h * hex.points.bottomLeft.y)
    ctx.lineTo(w * hex.points.bottomLeft.x, (h * hex.points.bottomLeft.y) - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.left.x, (h * hex.points.left.y) - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.left.x, h * hex.points.left.y)
    ctx.lineTo(w * hex.points.bottomLeft.x, h * hex.points.bottomLeft.y)
    ctx.fill()

    // The top
    ctx.beginPath()
    ctx.moveTo(w * hex.points.topLeft.x, h * hex.points.topLeft.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.topRight.x, h * hex.points.topRight.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.right.x, h * hex.points.right.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.bottomRight.x, h * hex.points.bottomRight.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.bottomLeft.x, h * hex.points.bottomLeft.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.left.x, h * hex.points.left.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.topLeft.x, h * hex.points.topLeft.y - (hex.height * maxHeight))
    ctx.fill()

    // Draw the front of the hexagon
    ctx.fillStyle = `hsl(${hex.darkColour.h}, ${hex.darkColour.s}%, ${hex.darkColour.l}%)`
    ctx.beginPath()
    ctx.moveTo(w * hex.points.bottomLeft.x, h * hex.points.bottomLeft.y)
    ctx.lineTo(w * hex.points.bottomLeft.x, (h * hex.points.bottomLeft.y) - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.bottomRight.x, (h * hex.points.bottomRight.y) - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.bottomRight.x, h * hex.points.bottomRight.y)
    ctx.lineTo(w * hex.points.bottomLeft.x, h * hex.points.bottomLeft.y)
    ctx.fill()

    // Draw the right of the hexagon
    ctx.fillStyle = `hsl(${hex.darkColour.h}, ${hex.darkColour.s}%, ${hex.darkColour.l * 0.75}%)`
    ctx.beginPath()
    ctx.moveTo(w * hex.points.bottomRight.x, h * hex.points.bottomRight.y)
    ctx.lineTo(w * hex.points.bottomRight.x, (h * hex.points.bottomRight.y) - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.right.x, (h * hex.points.right.y) - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.right.x, h * hex.points.right.y)
    ctx.lineTo(w * hex.points.bottomRight.x, h * hex.points.bottomRight.y)
    ctx.fill()

    //   Now draw the outline
    ctx.lineWidth = w / 300
    ctx.beginPath()
    ctx.moveTo(w * hex.points.left.x, h * hex.points.left.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.topLeft.x, h * hex.points.topLeft.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.topRight.x, h * hex.points.topRight.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.right.x, h * hex.points.right.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.right.x, h * hex.points.right.y)
    ctx.lineTo(w * hex.points.bottomRight.x, h * hex.points.bottomRight.y)
    ctx.lineTo(w * hex.points.bottomLeft.x, h * hex.points.bottomLeft.y)
    ctx.lineTo(w * hex.points.left.x, h * hex.points.left.y)
    ctx.closePath()
    ctx.stroke()

    // Draw the inner lines
    ctx.lineWidth = w / 600
    ctx.beginPath()
    ctx.moveTo(w * hex.points.left.x, h * hex.points.left.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.bottomLeft.x, h * hex.points.bottomLeft.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.bottomRight.x, h * hex.points.bottomRight.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.right.x, h * hex.points.right.y - (hex.height * maxHeight))
    ctx.moveTo(w * hex.points.bottomLeft.x, h * hex.points.bottomLeft.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.bottomLeft.x, h * hex.points.bottomLeft.y)
    ctx.moveTo(w * hex.points.bottomRight.x, h * hex.points.bottomRight.y - (hex.height * maxHeight))
    ctx.lineTo(w * hex.points.bottomRight.x, h * hex.points.bottomRight.y)
    ctx.stroke()
  }

  // restore the origin
  ctx.restore()
  setTimeout(() => {
    drawCanvas()
  }, 1000 / 24)
}

const autoDownloadCanvas = async (showHash = false) => {
  const element = document.createElement('a')
  element.setAttribute('download', `Hexagones_Landscape${fxhash}`)
  element.style.display = 'none'
  document.body.appendChild(element)
  let imageBlob = null
  imageBlob = await new Promise(resolve => document.getElementById('target').toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob, {
    type: 'image/png'
  }))
  element.click()
  document.body.removeChild(element)
}

// Add event listener for window resize
window.addEventListener('resize', async (e) => {
  // Clear the timeout
  window.clearTimeout(resizeTmr)
  // Set the timeout for 100ms to do the layout
  resizeTmr = window.setTimeout(async () => {
    await layoutCanvas()
  }, 1000)
})

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    await layoutCanvas()
  }

  // Toggle the paper texture
  if (e.key === 't') {
    drawPaper = !drawPaper
    await layoutCanvas()
  }

  if (e.key === 'f') {
    full = !full
    await layoutCanvas()
  }
})
//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  If paper1 has loaded and we haven't draw anything yet, then kick it all off
  if (paper1Loaded !== null && !drawn) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
