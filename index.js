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

const lerpColour = (source, target, amount) => {
  if (target.h >= 0) {
    const hueDiff = target.h - source.h
    if (hueDiff > 180) source.h += 360
    if (hueDiff < -180) source.h -= 360
    source.h = source.h + (target.h - source.h) * amount
    if (source.h > 360) source.h -= 360
    if (source.h < 0) source.h += 360
  }
  // Now lerp between the saturation and lightness of the light colour and the target colour
  if (target.s >= 0) source.s = source.s + (target.s - source.s) * amount
  if (target.l >= 0) source.l = source.l + (target.l - source.l) * amount
  return source
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
  let baseHexCount = Math.floor((fxrand() * 12 + 2) / 2) * 2
  // baseHexCount = 22
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
        colour: 'red',
        baseHexCount
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

  // Set all the offsets for the noise here
  const xHeightOffset = fxrand() * 1000 + 1234
  const yHeightOffset = fxrand() * 1000 + 777
  const xHeightMod = 4
  const yHeightMod = 4

  const xSlopeOffset = fxrand() * 1000 + 800
  const ySlopeOffset = fxrand() * 1000 + 720
  const xSlopeMod = 3
  const ySlopeMod = 5

  const xSlopeAmountOffset = fxrand() * 1000 + 1000
  const ySlopeAmountOffset = fxrand() * 1000 + 1000
  const xSlopeAmountMod = 100
  const ySlopeAmountMod = 200

  //   Colours
  const colourMode = ['noon', 'night', 'blueHour', 'goldenHour'][Math.floor(fxrand() * 5)]
  // colourMode = 'noon'

  if (fxrand() < 0.2) {
    features.gradient = 'light'
    if (fxrand() < 0.5) {
      features.gradient = 'dark'
    }
  }

  // Work out if we are doing threshold stuff
  if (fxrand() < 0.15) {
    features.threshhold = fxrand() * 0.4 + 0.4
    if (fxrand() < 0.4) features.lowerWithThreshhold = true
    if (fxrand() < 0.4) features.flatLand = true
  }
  // Sometimes have a flat top
  if (fxrand() < 0.1) features.flatSlopes = true
  // Sometimes break things down into three levels
  if (fxrand() < 0.2) features.threeLevels = true
  // If they are all facing one way
  if (fxrand() < 0.1) features.allFacingOneWay = Math.floor(fxrand() * 6) * 60 + 1

  // Should we hide the inner lines
  if (fxrand() < 0.15) features.hideInnerLines = true
  // Should we hide all the lines
  if (fxrand() < 0.15) features.hideAllLines = true

  //  Now we want to loop through the hexagons and work the edge points
  for (let i = 0; i < features.hexagons.length; i++) {
    const hex = features.hexagons[i]
    // Pass on if there's a gradient
    hex.gradient = features.gradient

    if (hex.colour === 'blue') {
      // Lets set a random height for the hexagon
      // Work out the height based on noise
      hex.height = (noise.perlin2(hex.x * xHeightMod + xHeightOffset, hex.y * yHeightMod + yHeightOffset) + 1) / 2
      if (features.threeLevels) hex.height = Math.floor(hex.height * 3) / 3

      if (features.threshhold) {
        if (hex.height < features.threshhold) {
          hex.height = 0
        } else {
          if (features.lowerWithThreshhold) hex.height = (hex.height - features.threshhold + 0.1)
        }
      }
      // hex.height = 0

      hex.points = {}
      hex.points.topLeft = {
        x: hex.x - xDistance,
        y: hex.y - yDistance,
        height: hex.height
      }
      hex.points.topRight = {
        x: hex.x + xDistance,
        y: hex.y - yDistance,
        height: hex.height
      }
      hex.points.right = {
        x: hex.x + sideDistance,
        y: hex.y,
        height: hex.height
      }
      hex.points.bottomRight = {
        x: hex.x + xDistance,
        y: hex.y + yDistance,
        height: hex.height
      }
      hex.points.bottomLeft = {
        x: hex.x - xDistance,
        y: hex.y + yDistance,
        height: hex.height
      }
      hex.points.left = {
        x: hex.x - sideDistance,
        y: hex.y,
        height: hex.height
      }

      // Now we want to work out which side of the hexagon is going to be raised
      const pickEdge = noise.perlin2(hex.x * xSlopeMod + xSlopeOffset, hex.y * ySlopeMod + ySlopeOffset)
      // Use inverse sine to convert the noise value into a number between 0 and 360
      const angle = Math.asin(pickEdge) * 360 / Math.PI * 1.5 + 180
      // The slope amount is how much the edge is going to be raised by, again controlled by noise
      let slopeAmount = (noise.perlin2(hex.x * xSlopeAmountMod + xSlopeAmountOffset, hex.y * ySlopeAmountMod + ySlopeAmountOffset) + 1) / 2
      if (hex.height === 0) {
        if (features.flatLand) {
          slopeAmount = 0
        } else {
          slopeAmount *= 0.2
        }
      }
      hex.slopeAmount = slopeAmount
      if (features.flatSlopes) hex.slopeAmount = 0

      // hex.slopeAmount = 1
      hex.angle = angle
      if (features.allFacingOneWay) hex.angle = features.allFacingOneWay
      console.log(features.allFacingOneWay)
      // This is a very long hand way of working out which edge to raise
      /*
      if (angle < 60) {
        hex.points.left.height += raiseHeight * slopeAmount
        hex.points.topLeft.height += raiseHeight * slopeAmount
        hex.points.topRight.height += raiseHeight / 2 * slopeAmount
        hex.points.bottomLeft.height += raiseHeight / 2 * slopeAmount
      }
      if (angle >= 60 && angle < 120) {
        hex.points.topLeft.height += raiseHeight * slopeAmount
        hex.points.topRight.height += raiseHeight * slopeAmount
        hex.points.left.height += raiseHeight / 2 * slopeAmount
        hex.points.right.height += raiseHeight / 2 * slopeAmount
      }
      if (angle >= 120 && angle < 180) {
        hex.points.topRight.height += raiseHeight * slopeAmount
        hex.points.right.height += raiseHeight * slopeAmount
        hex.points.topLeft.height += raiseHeight / 2 * slopeAmount
        hex.points.bottomRight.height += raiseHeight / 2 * slopeAmount
      }
      if (angle >= 180 && angle < 240) {
        hex.points.right.height += raiseHeight * slopeAmount
        hex.points.bottomRight.height += raiseHeight * slopeAmount
        hex.points.topRight.height += raiseHeight / 2 * slopeAmount
        hex.points.bottomLeft.height += raiseHeight / 2 * slopeAmount
      }
      if (angle >= 240 && angle < 300) {
        hex.points.bottomRight.height += raiseHeight * slopeAmount
        hex.points.bottomLeft.height += raiseHeight * slopeAmount
        hex.points.right.height += raiseHeight / 2 * slopeAmount
        hex.points.left.height += raiseHeight / 2 * slopeAmount
      }
      if (angle >= 300) {
        hex.points.bottomLeft.height += raiseHeight * slopeAmount
        hex.points.left.height += raiseHeight * slopeAmount
        hex.points.bottomRight.height += raiseHeight / 2 * slopeAmount
        hex.points.topLeft.height += raiseHeight / 2 * slopeAmount
      }
      */
      hex.lightColour = rgbToHsl(hexToRgb('#FCF3E8'))
      hex.darkColour = rgbToHsl(hexToRgb(RGBCYM[Math.floor(fxrand() * RGBCYM.length)]))

      const shades = {
        blueHour: {
          h: 250,
          s: 40,
          l: 73,
          amount: 0.8
        },
        goldenHour: {
          h: 27,
          s: 100,
          l: 55,
          amount: 0.8
        },
        night: {
          h: -1,
          s: -1,
          l: 0,
          amount: 0.7
        }
      }

      // const colourMode = ['noon', 'night', 'blueHour', 'goldenHour'][Math.floor(fxrand() * 4)]
      // console.log(colourMode)
      // Special colour for night
      if (colourMode === 'night') {
        hex.lightColour = {
          h: 0,
          s: 0,
          l: 50
        }
      }
      // How much we want to move towards the target colour

      if (shades[colourMode]) {
        // Lerp between the hue of the light colour and the target colour, remembering that we can
        // loop around the hue, without using the lerp function
        hex.lightColour = lerpColour(hex.lightColour, shades[colourMode], shades[colourMode].amount)
        // Do the same for the dark colour
        hex.darkColour = lerpColour(hex.darkColour, shades[colourMode], shades[colourMode].amount)
      }

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

const drawHex = (ctx, w, h, hex) => {
  // hex.height = (noise.perlin3(hex.x * 4 + features.xOffset, hex.y * 4 + features.yOffset, new Date().getTime() / 2000) + 1) / 2
  const maxHeight = (hex.points.right.x - hex.points.left.x) * (hex.baseHexCount / 6)
  const slopeAmount = hex.slopeAmount * maxHeight / (hex.baseHexCount / 4)

  // Now we go through working out the top and bottom points of the hexagon
  const allPoints = {
    bottom: {
      topLeft: {
        x: hex.points.topLeft.x,
        y: hex.points.topLeft.y
      },
      topRight: {
        x: hex.points.topRight.x,
        y: hex.points.topRight.y
      },
      left: {
        x: hex.points.left.x,
        y: hex.points.left.y
      },
      right: {
        x: hex.points.right.x,
        y: hex.points.right.y
      },
      bottomLeft: {
        x: hex.points.bottomLeft.x,
        y: hex.points.bottomLeft.y
      },
      bottomRight: {
        x: hex.points.bottomRight.x,
        y: hex.points.bottomRight.y
      }
    },
    top: {
      topLeft: {
        x: hex.points.topLeft.x - maxHeight * hex.height,
        y: hex.points.topLeft.y - maxHeight * hex.height
      },
      topRight: {
        x: hex.points.topRight.x - maxHeight * hex.height,
        y: hex.points.topRight.y - maxHeight * hex.height
      },
      left: {
        x: hex.points.left.x - maxHeight * hex.height,
        y: hex.points.left.y - maxHeight * hex.height
      },
      right: {
        x: hex.points.right.x - maxHeight * hex.height,
        y: hex.points.right.y - maxHeight * hex.height
      },
      bottomLeft: {
        x: hex.points.bottomLeft.x - maxHeight * hex.height,
        y: hex.points.bottomLeft.y - maxHeight * hex.height
      },
      bottomRight: {
        x: hex.points.bottomRight.x - maxHeight * hex.height,
        y: hex.points.bottomRight.y - maxHeight * hex.height
      }
    }
  }

  // Now we need to add the slope values to the points
  if (hex.angle < 60) {
    allPoints.top.topLeft.y -= slopeAmount
    allPoints.top.topRight.y -= slopeAmount
    allPoints.top.right.y -= slopeAmount / 2
    allPoints.top.left.y -= slopeAmount / 2
  }
  if (hex.angle >= 60 && hex.angle < 120) {
    allPoints.top.topRight.y -= slopeAmount
    allPoints.top.right.y -= slopeAmount
    allPoints.top.topLeft.y -= slopeAmount / 2
    allPoints.top.bottomRight.y -= slopeAmount / 2
  }
  if (hex.angle >= 120 && hex.angle < 180) {
    allPoints.top.right.y -= slopeAmount
    allPoints.top.bottomRight.y -= slopeAmount
    allPoints.top.topRight.y -= slopeAmount / 2
    allPoints.top.bottomLeft.y -= slopeAmount / 2
  }
  if (hex.angle >= 180 && hex.angle < 240) {
    allPoints.top.bottomRight.y -= slopeAmount
    allPoints.top.bottomLeft.y -= slopeAmount
    allPoints.top.right.y -= slopeAmount / 2
    allPoints.top.left.y -= slopeAmount / 2
  }
  if (hex.angle >= 240 && hex.angle < 300) {
    allPoints.top.bottomLeft.y -= slopeAmount
    allPoints.top.left.y -= slopeAmount
    allPoints.top.topLeft.y -= slopeAmount / 2
    allPoints.top.bottomRight.y -= slopeAmount / 2
  }
  if (hex.angle >= 300) {
    allPoints.top.left.y -= slopeAmount
    allPoints.top.topLeft.y -= slopeAmount
    allPoints.top.topRight.y -= slopeAmount / 2
    allPoints.top.bottomLeft.y -= slopeAmount / 2
  }

  const facePoints = [
    { x: allPoints.top.topLeft.x, y: allPoints.top.topLeft.y },
    { x: allPoints.top.topRight.x, y: allPoints.top.topRight.y },
    { x: allPoints.top.right.x, y: allPoints.top.right.y },
    { x: allPoints.top.bottomRight.x, y: allPoints.top.bottomRight.y },
    { x: allPoints.top.bottomLeft.x, y: allPoints.top.bottomLeft.y },
    { x: allPoints.top.left.x, y: allPoints.top.left.y }
  ]
  // Calculate if the points are clockwise or anti-clockwise
  let isClockwise = true
  let sum = 0
  for (let i = 0; i < facePoints.length; i++) {
    const p1 = facePoints[i]
    const p2 = facePoints[(i + 1) % facePoints.length]
    sum += (p2.x - p1.x) * (p2.y + p1.y)
  }
  if (sum > 0) {
    isClockwise = false
  }
  const showTopFace = isClockwise

  // Draw the left of the hexagon
  ctx.fillStyle = `hsl(${hex.lightColour.h}, ${hex.lightColour.s}%, ${hex.lightColour.l * 0.975}%)`
  ctx.beginPath()
  ctx.moveTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
  ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
  ctx.lineTo(w * allPoints.bottom.left.x, h * allPoints.top.left.y)
  ctx.lineTo(w * allPoints.bottom.left.x, h * allPoints.bottom.left.y)
  ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
  ctx.fill()

  // The top
  ctx.fillStyle = `hsl(${hex.lightColour.h}, ${hex.lightColour.s}%, ${hex.lightColour.l}%)`
  ctx.beginPath()
  ctx.moveTo(w * allPoints.bottom.topLeft.x, h * allPoints.top.topLeft.y)
  ctx.lineTo(w * allPoints.bottom.topRight.x, h * allPoints.top.topRight.y)
  ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.top.right.y)
  ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
  ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
  ctx.lineTo(w * allPoints.bottom.left.x, h * allPoints.top.left.y)
  ctx.lineTo(w * allPoints.bottom.topLeft.x, h * allPoints.top.topLeft.y)
  ctx.fill()

  // Draw the front of the hexagon
  ctx.fillStyle = `hsl(${hex.darkColour.h}, ${hex.darkColour.s}%, ${hex.darkColour.l}%)`
  const gradient = ctx.createLinearGradient(
    w * allPoints.top.bottomLeft.x,
    h * allPoints.top.bottomLeft.y,
    w * allPoints.bottom.bottomRight.x,
    h * allPoints.bottom.bottomRight.y
  )
  if (hex.gradient === 'light') {
    gradient.addColorStop(0, `hsl(${hex.lightColour.h}, ${hex.lightColour.s}%, ${hex.lightColour.l}%)`)
    gradient.addColorStop(1, `hsl(${hex.darkColour.h}, ${hex.darkColour.s}%, ${hex.darkColour.l}%)`)
    ctx.fillStyle = gradient
  }
  if (hex.gradient === 'dark') {
    gradient.addColorStop(0, `hsl(${hex.darkColour.h}, ${hex.darkColour.s}%, ${hex.darkColour.l}%)`)
    gradient.addColorStop(1, `hsl(${hex.lightColour.h}, ${hex.lightColour.s}%, ${hex.lightColour.l}%)`)
    ctx.fillStyle = gradient
  }
  ctx.beginPath()
  ctx.moveTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
  ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
  ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
  ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
  ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
  ctx.fill()

  // Draw the right of the hexagon
  ctx.fillStyle = `hsl(${hex.darkColour.h}, ${hex.darkColour.s}%, ${hex.darkColour.l * 0.75}%)`
  ctx.beginPath()
  ctx.moveTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
  ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
  ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.top.right.y)
  ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.bottom.right.y)
  ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
  ctx.fill()

  // Draw all the lines
  if (!features.hideAllLines) {
    const thickLine = w / 600 * (22 / hex.baseHexCount)
    const thinLine = w / 1200 * (22 / hex.baseHexCount)

    if (!showTopFace) {
      // Draw the outline
      ctx.lineWidth = thickLine
      ctx.beginPath()
      ctx.moveTo(w * allPoints.bottom.left.x, h * allPoints.top.left.y)
      ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
      ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
      ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.top.right.y)
      ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.bottom.right.y)
      ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
      ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
      ctx.lineTo(w * allPoints.bottom.left.x, h * allPoints.bottom.left.y)
      ctx.closePath()
      ctx.stroke()

      // Draw the inner lines
      if (!features.hideInnerLines) {
        ctx.lineWidth = thinLine
        ctx.beginPath()
        ctx.moveTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
        ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
        ctx.moveTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
        ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
        ctx.stroke()
      }
    } else {
      //   Draw the outline
      ctx.lineWidth = thickLine
      ctx.beginPath()
      ctx.moveTo(w * allPoints.bottom.left.x, h * allPoints.top.left.y)
      ctx.lineTo(w * allPoints.bottom.topLeft.x, h * allPoints.top.topLeft.y)
      ctx.lineTo(w * allPoints.bottom.topRight.x, h * allPoints.top.topRight.y)
      ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.top.right.y)
      ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.bottom.right.y)
      ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
      ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
      ctx.lineTo(w * allPoints.bottom.left.x, h * allPoints.bottom.left.y)
      ctx.closePath()
      ctx.stroke()

      // Draw the inner lines
      if (!features.hideInnerLines) {
        ctx.lineWidth = thinLine
        ctx.beginPath()
        ctx.moveTo(w * allPoints.bottom.left.x, h * allPoints.top.left.y)
        ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
        ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
        ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.top.right.y)
        ctx.moveTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
        ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
        ctx.moveTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
        ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
        ctx.stroke()
      }
    }
  }
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
  const maxHeight = h / features.heightMod

  // set the fill style to red
  // Set the origin to the middle of the canvas
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.lineJoin = 'round'
  //  Draw the hexagons
  for (let i = 0; i < features.hexagons.length; i++) {
    const hex = features.hexagons[i]
    drawHex(ctx, w, h, hex)
  }

  // restore the origin
  ctx.restore()
  /*
  setTimeout(() => {
    drawCanvas()
  }, 1000 / 24)
  */
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
