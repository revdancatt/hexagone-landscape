/* global preloadImagesTmr fxhash fxrand noise */

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
const BLACK = ['#000000']
const RGBCYM = [RED, GREEN, BLUE, CYAN, MAGENTA, YELLOW]
const RGB = [RED, GREEN, BLUE]
const CYM = [CYAN, MAGENTA, YELLOW]

const shades = {
  blueHour: {
    h: 210,
    s: 100,
    l: 90,
    amount: 0.8
  },
  green: {
    h: 120,
    s: 100,
    l: 20,
    amount: 0.9
  },
  goldenHour: {
    h: 30,
    s: 100,
    l: 55,
    amount: 0.4
  },
  night: {
    h: -1,
    s: -1,
    l: 0,
    amount: 0.4
  }
}

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

// Write our own lerp function
const lerp = (a, b, n) => {
  return (1 - n) * a + n * b
}

const lerpColour = (s, t, amount) => {
  const source = JSON.parse(JSON.stringify(s))
  const target = JSON.parse(JSON.stringify(t))
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

  // We want somewhere to store all the hexagon co-ordiantes
  features.hexagons = []
  //  We want to have a randome number of hexagons visible across the screen,
  //  we'll base everything else of this number
  let baseHexCount = Math.floor((fxrand() * 10 + 2) / 2) * 4
  if (fxrand() < 0.04) {
    features.excessive = true
    baseHexCount = (baseHexCount + 12) * 2
  }

  //  Now we know we want 3 times that many hexagons in the x direction
  const maxHexAcross = baseHexCount * 3
  // And 3 times and the ratio of the screen in the y direction
  const maxHexDown = baseHexCount * 7 * ratio
  // Store them so we know how many we have later
  features.maxHexAcross = maxHexAcross
  features.maxHexDown = maxHexDown

  // THIS IS A VERY BAD WAY OF PLACING THE HEXAGONS, DON'T DO THIS!!!!

  // Now loop throught them creating the hexagons, but we want to start
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

  // Work out if we are doing threshold stuff
  if (fxrand() < 0.15) {
    features.threshhold = fxrand() * 0.4 + 0.4
    if (fxrand() < 0.4) features.lowerWithThreshhold = true
    if (fxrand() < 0.4) features.flatLand = true
  }
  // Sometimes have a flat top
  if (fxrand() < 0.25) features.flatSlopes = true
  // Sometimes break things down into three levels
  if (fxrand() < 0.2) features.threeLevels = true
  // If they are all facing one way
  if (fxrand() < 0.12) features.allFacingOneWay = Math.floor(fxrand() * 6) * 60 + 1

  // Should we hide the inner lines
  if (fxrand() < 0.15) features.hideInnerLines = true
  // Should we hide all the lines
  if (fxrand() < 0.15) features.hideAllLines = true

  const lightPalettes = ['#FFFFFF', '#FCF3E8', '#EDDCC0', '#FFFFFF', '#FCF3E8', '#EDDCC0', '#FFFFFF', '#FCF3E8', '#EDDCC0', '#FFFFFF', '#FCF3E8', '#EBD5B0', '#2B6EA1', '#A12B4C', '#2B6EA1', '#A12B4C', '#333333']
  const darkPalettes = [BLACK, RGB, CYM, RGBCYM, [RED, BLUE], [RED], [BLUE], [YELLOW, GREEN, CYAN], ['#264F78', '#E19FC5'], ['#CF5155', '#FCBA41', '#DE723F']]
  features.lightChoice = Math.floor(fxrand() * lightPalettes.length)
  features.darkChoice = Math.floor(fxrand() * darkPalettes.length)

  features.lightColour = rgbToHsl(hexToRgb(lightPalettes[features.lightChoice]))
  features.darkColour = darkPalettes[features.darkChoice]
  if (fxrand() < 0.75) features.leftMatchesTop = true

  const colourModes = ['night', 'blueHour', 'goldenHour', 'night', 'blueHour', 'goldenHour', 'blueHour', 'goldenHour', 'blueHour', 'goldenHour', 'green']
  let colourMode = 'noon'
  if (fxrand() < 0.2) {
    colourMode = colourModes[Math.floor(fxrand() * colourModes.length)]
  }
  if (fxrand() < 0.08) features.shuffleTint = true

  //   Sometimes use a gradient
  if (fxrand() < 0.2) {
    features.gradient = 'light'
    if (fxrand() < 0.5) {
      features.gradient = 'dark'
    }
  }

  let totalHeight = 0
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
      totalHeight += hex.height

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
      if (features.allFacingOneWay) hex.slopeAmount = 0.6

      // hex.slopeAmount = 1
      hex.angle = angle
      if (features.allFacingOneWay) hex.angle = features.allFacingOneWay

      //   Colours
      if (features.shuffleTint) {
        colourMode = 'noon'
        if (fxrand() < 0.99) {
          colourMode = ['blueHour', 'goldenHour', 'blueHour', 'goldenHour', 'green'][Math.floor(fxrand() * 5)]
        }
      }
      // console.log('colourMode', colourMode)

      hex.lightColour = features.lightColour
      hex.darkColour = rgbToHsl(hexToRgb(features.darkColour[Math.floor(fxrand() * features.darkColour.length)]))
      hex.leftMatchesTop = features.leftMatchesTop

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

  if (totalHeight === 0) {
    for (let i = 0; i < features.hexagons.length; i++) {
      const hex = features.hexagons[i]
      const pickEdge = noise.perlin2(hex.x * xSlopeMod + xSlopeOffset, hex.y * ySlopeMod + ySlopeOffset)
      // Use inverse sine to convert the noise value into a number between 0 and 360
      const angle = Math.asin(pickEdge) * 360 / Math.PI * 1.5 + 180
      // The slope amount is how much the edge is going to be raised by, again controlled by noise
      const slopeAmount = (noise.perlin2(hex.x * xSlopeAmountMod + xSlopeAmountOffset, hex.y * ySlopeAmountMod + ySlopeAmountOffset) + 1) / 2
      hex.slopeAmount = slopeAmount * 0.25
      hex.angle = angle
      features.flatSlopes = false
      features.wargamer = true
    }
  }

  features.hexagons = newHexagons

  // Maybe we'll rib the hex, but only if there are lines to be drawn
  features.ribbed = fxrand() < 0.09
  features.ribbedChance = 0.2
  if (fxrand() < 0.25) features.ribbedChance = 1

  if (features.hideAllLines) features.ribbed = false
  // if (features.hideInnerLines) features.ribbed = false
  if (features.wargamer) features.ribbed = false
  if (features.gradient) features.ribbed = false

  features.holed = fxrand() < 0.17
  features.holedChance = 0.1
  if (fxrand() < 0.25) features.holedChance = 1

  // Add the features
  for (let i = 0; i < features.hexagons.length; i++) {
    const hex = features.hexagons[i]
    if (features.ribbed && fxrand() < features.ribbedChance) hex.ribbed = true
    if (features.holed && fxrand() < features.holedChance) hex.holed = fxrand() * 0.4 + 0.3
  }

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

  // DO NOT LOOK AT HOW I AM DOING THESE, I AM NOW TIRED
  window.$fxhashFeatures.Excessive = false
  if (features.excessive) window.$fxhashFeatures.Excessive = true
  window.$fxhashFeatures.Valleys = 'threshhold' in features
  window.$fxhashFeatures['Flat Tops'] = 'flatSlopes' in features
  if ('allFacingOneWay' in features) window.$fxhashFeatures['Flat Tops'] = false
  window.$fxhashFeatures.Levels = 'threeLevels' in features && 'flatSlopes' in features
  window.$fxhashFeatures['Sun Salutation'] = 'allFacingOneWay' in features
  window.$fxhashFeatures.Drawing = 'Lines'
  window.$fxhashFeatures.Style = 'Solid'
  window.$fxhashFeatures.Palette = ['Black', 'RGB', 'CYM', 'RGBCYM', 'Imperial', 'Old', 'Print', 'Spring', 'Stolen from Acequia One', 'Stolen from Acequia Two'][features.darkChoice]
  window.$fxhashFeatures.Accent = ['Light', 'Lightish', 'Paper', 'Light', 'Lightish', 'Paper', 'Light', 'Lightish', 'Paper', 'Light', 'Lightish', 'Imperceptibly no different', 'Palace', 'Pits', 'Palace', 'Pits', 'Inky'][features.lightChoice]
  if ('gradient' in features) window.$fxhashFeatures.Style = 'Wash'
  if (features.hideInnerLines) window.$fxhashFeatures.Drawing = 'Cell'
  if (features.hideAllLines) window.$fxhashFeatures.Drawing = 'None'
  window.$fxhashFeatures.Tint = colourMode
  if (colourMode === 'noon') window.$fxhashFeatures.Tint = 'Noon'
  if (colourMode === 'blueHour') window.$fxhashFeatures.Tint = 'Blue hour'
  if (colourMode === 'goldenHour') window.$fxhashFeatures.Tint = 'Golden hour'
  if (colourMode === 'green') window.$fxhashFeatures.Tint = 'Green'
  if (colourMode === 'night') window.$fxhashFeatures.Tint = 'Night'
  if (features.shuffleTint) window.$fxhashFeatures.Tint = 'Shuffle'
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

  //  And draw it!!
  drawCanvas()
}

const drawHex = (ctx, w, h, hex) => {
  // hex.height = (noise.perlin3(hex.x * 4 + features.xOffset, hex.y * 4 + features.yOffset, new Date().getTime() / 2000) + 1) / 2
  const maxHeight = (hex.points.right.x - hex.points.left.x) * (hex.baseHexCount / 6)
  const slopeAmount = hex.slopeAmount * maxHeight / (hex.baseHexCount / 4)
  const thickLine = w / 600 * (22 / hex.baseHexCount)
  const thinLine = w / 1200 * (22 / hex.baseHexCount)
  let lineColour = 'black'
  if (window.$fxhashFeatures.Palette === 'Black' && window.$fxhashFeatures.Accent === 'Inky') lineColour = 'white'

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

  const leftColour = {
    h: hex.darkColour.h,
    s: hex.darkColour.s,
    l: hex.darkColour.l * 1.2
  }
  if (hex.leftMatchesTop) {
    leftColour.h = hex.lightColour.h
    leftColour.s = hex.lightColour.s
    leftColour.l = hex.lightColour.l * 0.975
  }
  const leftFaceColour = `hsl(${leftColour.h}, ${leftColour.s}%, ${leftColour.l}%)`
  // Draw the left of the hexagon
  ctx.fillStyle = leftFaceColour
  ctx.beginPath()
  ctx.moveTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
  ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
  ctx.lineTo(w * allPoints.bottom.left.x, h * allPoints.top.left.y)
  ctx.lineTo(w * allPoints.bottom.left.x, h * allPoints.bottom.left.y)
  ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
  ctx.fill()

  // The step for drawing the lines
  const step = thickLine * 2
  ctx.lineWidth = thickLine / 2
  ctx.lineCap = 'square'

  // If the hexagon is ribbed then we need to draw the ribs
  ctx.save()
  ctx.clip()
  if (hex.ribbed) {
    const ribStart = {
      x: allPoints.bottom.left.x,
      y: allPoints.top.left.y
    }
    const ribEnd = {
      x: allPoints.bottom.bottomLeft.x,
      y: allPoints.top.bottomLeft.y
    }
    // Loop around ten times to draw the ribs
    for (let i = 0; i < 20; i++) {
      const percent = i / 20
      const ribColour = lerpColour(hex.darkColour, leftColour, percent)
      ctx.strokeStyle = `hsl(${ribColour.h}, ${ribColour.s}%, ${ribColour.l}%)`
      // Draw the rib
      ctx.beginPath()
      ctx.moveTo(w * ribStart.x, h * ribStart.y + (step * (i + 1)))
      ctx.lineTo(w * ribEnd.x, h * ribEnd.y + (step * (i + 1)))
      ctx.stroke()
    }
  }
  ctx.restore()

  // Draw the right of the hexagon
  const rightFaceColour = `hsl(${hex.darkColour.h}, ${hex.darkColour.s}%, ${hex.darkColour.l * 0.75}%)`
  ctx.fillStyle = rightFaceColour
  ctx.beginPath()
  ctx.moveTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
  ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
  ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.top.right.y)
  ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.bottom.right.y)
  ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
  ctx.fill()

  ctx.save()
  ctx.clip()
  // If the hexagon is ribbed then we need to draw the ribs
  if (hex.ribbed) {
    const ribStart = {
      x: allPoints.bottom.bottomRight.x,
      y: allPoints.top.bottomRight.y
    }
    const ribEnd = {
      x: allPoints.bottom.right.x,
      y: allPoints.top.right.y
    }
    // Loop around ten times to draw the ribs
    for (let i = 0; i < 20; i++) {
      const percent = i / 20
      const ribColour = lerpColour(hex.lightColour, {
        h: hex.darkColour.h,
        s: hex.darkColour.s,
        l: hex.darkColour.l * 0.75
      }, percent)
      ctx.strokeStyle = `hsl(${ribColour.h}, ${ribColour.s}%, ${ribColour.l}%)`
      // Draw the rib
      ctx.beginPath()
      ctx.moveTo(w * ribStart.x, h * ribStart.y + (step * (i + 1)))
      ctx.lineTo(w * ribEnd.x, h * ribEnd.y + (step * (i + 1)))
      ctx.stroke()
    }
  }
  ctx.restore()

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
  const frontFaceColour = ctx.fillStyle
  ctx.beginPath()
  ctx.moveTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
  ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
  ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
  ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.bottom.bottomRight.y)
  ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.bottom.bottomLeft.y)
  ctx.fill()

  ctx.save()
  ctx.clip()
  // If the hexagon is ribbed then we need to draw the ribs
  if (hex.ribbed) {
    const ribStart = {
      x: allPoints.bottom.bottomLeft.x,
      y: allPoints.top.bottomLeft.y
    }
    const ribEnd = {
      x: allPoints.bottom.bottomRight.x,
      y: allPoints.top.bottomRight.y
    }
    // Loop around ten times to draw the ribs
    for (let i = 0; i < 20; i++) {
      const percent = i / 20
      const ribColour = lerpColour(leftColour, hex.darkColour, percent)
      ctx.strokeStyle = `hsl(${ribColour.h}, ${ribColour.s}%, ${ribColour.l}%)`
      // Draw the rib
      ctx.beginPath()
      ctx.moveTo(w * ribStart.x, h * ribStart.y + (step * (i + 1)))
      ctx.lineTo(w * ribEnd.x, h * ribEnd.y + (step * (i + 1)))
      ctx.stroke()
    }
  }
  ctx.restore()

  // The top
  if (showTopFace) {
    ctx.lineWidth = thinLine / 10
    ctx.fillStyle = `hsl(${hex.lightColour.h}, ${hex.lightColour.s}%, ${hex.lightColour.l}%)`
    ctx.strokeStyle = `hsl(${hex.lightColour.h}, ${hex.lightColour.s}%, ${hex.lightColour.l}%)`
    ctx.beginPath()
    ctx.moveTo(w * allPoints.bottom.topLeft.x, h * allPoints.top.topLeft.y)
    ctx.lineTo(w * allPoints.bottom.topRight.x, h * allPoints.top.topRight.y)
    ctx.lineTo(w * allPoints.bottom.right.x, h * allPoints.top.right.y)
    ctx.lineTo(w * allPoints.bottom.bottomRight.x, h * allPoints.top.bottomRight.y)
    ctx.lineTo(w * allPoints.bottom.bottomLeft.x, h * allPoints.top.bottomLeft.y)
    ctx.lineTo(w * allPoints.bottom.left.x, h * allPoints.top.left.y)
    ctx.lineTo(w * allPoints.bottom.topLeft.x, h * allPoints.top.topLeft.y)
    ctx.stroke()
    ctx.fill()
  }

  // Draw all the lines
  ctx.strokeStyle = lineColour
  ctx.lineCap = 'round'
  if (!features.hideAllLines) {
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

  // If we're showing the top face and this hex has a hole in it, draw the hole
  if (showTopFace && hex.holed) {
    // First step is to work out the middle of the face, this is the point
    // halfway between the top left and right points
    const middleOfFace = {
      x: lerp(allPoints.bottom.left.x, allPoints.bottom.right.x, 0.5),
      y: lerp(allPoints.top.left.y, allPoints.top.right.y, 0.5)
    }
    // Now work out all six points of the hole
    const holePoints = {
      topLeft: {
        x: lerp(allPoints.bottom.topLeft.x, middleOfFace.x, hex.holed),
        y: lerp(allPoints.top.topLeft.y, middleOfFace.y, hex.holed)
      },
      topRight: {
        x: lerp(allPoints.bottom.topRight.x, middleOfFace.x, hex.holed),
        y: lerp(allPoints.top.topRight.y, middleOfFace.y, hex.holed)
      },
      right: {
        x: lerp(allPoints.bottom.right.x, middleOfFace.x, hex.holed),
        y: lerp(allPoints.top.right.y, middleOfFace.y, hex.holed)
      },
      bottomRight: {
        x: lerp(allPoints.bottom.bottomRight.x, middleOfFace.x, hex.holed),
        y: lerp(allPoints.top.bottomRight.y, middleOfFace.y, hex.holed)
      },
      bottomLeft: {
        x: lerp(allPoints.bottom.bottomLeft.x, middleOfFace.x, hex.holed),
        y: lerp(allPoints.top.bottomLeft.y, middleOfFace.y, hex.holed)
      },
      left: {
        x: lerp(allPoints.bottom.left.x, middleOfFace.x, hex.holed),
        y: lerp(allPoints.top.left.y, middleOfFace.y, hex.holed)
      }
    }

    // Now draw the hole in black
    // Make the mask
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(w * holePoints.left.x, h * holePoints.left.y)
    ctx.lineTo(w * holePoints.topLeft.x, h * holePoints.topLeft.y)
    ctx.lineTo(w * holePoints.topRight.x, h * holePoints.topRight.y)
    ctx.lineTo(w * holePoints.right.x, h * holePoints.right.y)
    ctx.lineTo(w * holePoints.bottomRight.x, h * holePoints.bottomRight.y)
    ctx.lineTo(w * holePoints.bottomLeft.x, h * holePoints.bottomLeft.y)
    ctx.lineTo(w * holePoints.left.x, h * holePoints.left.y)
    ctx.closePath()
    ctx.clip()

    // Now draw the back face
    ctx.fillStyle = frontFaceColour
    ctx.beginPath()
    ctx.moveTo(w * holePoints.topLeft.x, h * holePoints.topLeft.y)
    ctx.lineTo(w * holePoints.topRight.x, h * holePoints.topRight.y)
    ctx.lineTo(w * holePoints.topRight.x, h * holePoints.topRight.y + h)
    ctx.lineTo(w * holePoints.topLeft.x, h * holePoints.topLeft.y + h)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = leftFaceColour
    ctx.beginPath()
    ctx.moveTo(w * holePoints.topRight.x, h * holePoints.topRight.y)
    ctx.lineTo(w * holePoints.right.x, h * holePoints.right.y)
    ctx.lineTo(w * holePoints.right.x, h * holePoints.right.y + h)
    ctx.lineTo(w * holePoints.topRight.x, h * holePoints.topRight.y + h)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = rightFaceColour
    ctx.beginPath()
    ctx.moveTo(w * holePoints.left.x, h * holePoints.left.y)
    ctx.lineTo(w * holePoints.topLeft.x, h * holePoints.topLeft.y)
    ctx.lineTo(w * holePoints.topLeft.x, h * holePoints.topLeft.y + h)
    ctx.lineTo(w * holePoints.left.x, h * holePoints.left.y + h)
    ctx.closePath()
    ctx.fill()

    // If we are not hiding the inner lines, draw them
    if (!features.hideInnerLines && !features.hideAllLines) {
      ctx.strokeStyle = lineColour
      ctx.lineWidth = thinLine
      ctx.beginPath()
      ctx.moveTo(w * holePoints.topLeft.x, h * holePoints.topLeft.y)
      ctx.lineTo(w * holePoints.topLeft.x, h * holePoints.topLeft.y + h)
      ctx.moveTo(w * holePoints.topRight.x, h * holePoints.topRight.y)
      ctx.lineTo(w * holePoints.topRight.x, h * holePoints.topRight.y + h)
      ctx.stroke()
    }

    // Clear the mask
    ctx.restore()

    // If we're not hiding all the lines draw the hole lines
    if (!features.hideAllLines) {
      ctx.strokeStyle = lineColour
      ctx.lineWidth = thinLine
      ctx.beginPath()
      ctx.moveTo(w * holePoints.left.x, h * holePoints.left.y)
      ctx.lineTo(w * holePoints.topLeft.x, h * holePoints.topLeft.y)
      ctx.lineTo(w * holePoints.topRight.x, h * holePoints.topRight.y)
      ctx.lineTo(w * holePoints.right.x, h * holePoints.right.y)
      ctx.lineTo(w * holePoints.bottomRight.x, h * holePoints.bottomRight.y)
      ctx.lineTo(w * holePoints.bottomLeft.x, h * holePoints.bottomLeft.y)
      ctx.lineTo(w * holePoints.left.x, h * holePoints.left.y)
      ctx.stroke()
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

  ctx.fillStyle = '#F9F9F9'
  ctx.fillRect(0, 0, w, h)

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
    console.log('Highres mode is now', highRes)
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
  if (!drawn) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
