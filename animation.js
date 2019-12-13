gsap.registerPlugin(MotionPathPlugin);

const moveSpeed = 15;
const flyInDuration = 1.5;
const flyInDelay = 0.2;
const eyesBlinkDelayMin = 1.75;
const eyesBlinkDelayMax = 5;
const fontSizeStart = "300%";
const fontSizeEnd = "700%";
const fontColorStart = "rgba(0, 0, 0, 0)";
const fontColorEnd = "rgba(0, 0, 0, 0.5)";
const fontShineColor = "rgba(0, 0, 0, 0.85)";
const textAlign = "2%";
const textSpacingStart = 1500;
const textSpacingEnd = 560;
const robot = document.getElementById("robot");

// Setup
const setup = () => {
  // scale 0.01 fordi firefox ikke fatter en skid!
  gsap.set(robot, { scale: 0.01, immediateRender: true, transformOrigin: "50% 50%" });
  gsap.set(["#leftEye", "#rightEye"], { transformOrigin: "50% 60%" });
  gsap.set("#left-arm", { rotate: 20, xPercent: 5.5, transformOrigin: "100% 60%" });
  gsap.set("#right-arm", { rotate: -20, transformOrigin: "0% 50%" });
  gsap.set("#textPathWrapper", { attr: { textLength: textSpacingStart }});
  gsap.set("#textPath", { attr: {
    startOffset: "68%",
    textLength: textSpacingStart,
    "font-size": fontSizeStart,
    fill: fontColorStart
  }})
}
setup()

// hjælpe funktion til udregning af moves
// kort version
// const findSum = (a, b = 0) => (Math.sign(a) == 1) === (Math.sign(b) == 1) ? Math.abs(a - b) : (Math.sign(a) == 1) ? a + Math.abs(b) : Math.abs(a) + b;
const findSumFromTo = (a, b = 0) => {
  let isPlusA = Math.sign(a) == 1;
  let isPlusB = Math.sign(b) == 1;
  return isPlusA === isPlusB 
    ? Math.abs(a - b) 
    : (isPlusA ? a + Math.abs(b) : Math.abs(a) + b)
}

// funktion til at udregne moves
const getTweens = (array, duration) => {
  const totalSum = array.reduce((total, currentValue, currentIndex, array) => {
    return currentIndex === 0 
    ? { 
      x: Math.abs(currentValue.x), 
      y: Math.abs(currentValue.y)
    }
    : { 
      x: total.x + findSumFromTo(array[currentIndex - 1].x, array[currentIndex].x),
      y: total.y + findSumFromTo(array[currentIndex - 1].y, array[currentIndex].y),
    }
  }, {x: 0, y: 0})

  let newArr = [];
  array.map((obj, i) => {
    i === 0 || i + 1 >= array.length
    ? newArr.push({ 
      x: obj.x, 
      y: obj.y, 
      duration: (Math.abs(obj.y) / totalSum.y) * duration * 2,
      ease: i === 0 ? 'sine.out' : 'sine.in'
    })
    : newArr.push({
      x: obj.x, 
      y: obj.y, 
      duration: (findSumFromTo(array[i].y, array[i + 1].y) / totalSum.y) * duration,
      ease: 'sine.inOut'
    })
  })
  return newArr
}

const moveValues = [
  {x: -0.8, y: -4},
  {x: -0.5, y: 7},
  {x: 1.5, y: -5},
  {x: -0.4, y: 7},
  {x: 0.8, y: -8},
  {x: -0.4, y: 5}, 
  {x: -0.6, y: -6},
  {x: 0.4, y: 7},
  {x: 0.2, y: -3}
]

const moves = () => {
  const tl = gsap.timeline({paused: true, repeat: -1 });
  getTweens(moveValues, moveSpeed).map(tween => {
    return tl.to(robot, {
      duration: tween.duration,
      xPercent: `+=${tween.x}`,
      yPercent: `+=${tween.y}`,
      ease: tween.ease
    });
  });
  return tl
}

// ingen return af tl, så øjene blinker selvom master timeline er på pause
// bliver dog først kaldt når robot'en er fløjet ind
const eyesBlink = () => {
  const tl = gsap.timeline({ yoyo: true, onComplete: eyesBlink });
  let delay = gsap.utils.random(eyesBlinkDelayMin, eyesBlinkDelayMax);

  tl.to(["#leftEye", "#rightEye"], { delay, duration: 0.12, scaleY: 0.05})
  .to(["#leftEye", "#rightEye"], { duration: 0.12, scaleY: 1});
}

const armsDown = () => {
  const delay = 0.4;
  const tl = gsap.timeline({ paused: true });
  return tl.to("#right-arm", { delay, duration: 1, rotate: 0})
  .to("#left-arm", { delay, duration: 1, rotate: -5}, 0)
}

const thruster = () => {
  const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true });
  return tl.fromTo("#thrusterInner", {
    opacity: 0.3,
    scale: 1,
  },
  {
    duration: 0.25,
    opacity: 1,
    scale: 1.08,
  })
}

const flyIn = () => {
  const tl = gsap.timeline({ paused: true });
  // fix for robot starter bag globe og ender foran / zindex i svg
  return tl.call(() => svg.appendChild(robot), null, flyInDuration / 3)
  .to(robot, {
    duration: flyInDuration, 
    ease: "sine.Out",
    motionPath: {
      autoRotate: 75,
      path: "#flyInPath",
      align: "self",
      immediateRender: true,
    }
  }, 0)

  .to(robot, {
    scale: 1,
    duration: flyInDuration,
    ease: "power3.In",
  }, 0)

  // shadow bliver først sat lige før "landing"
  .to("#robotShadow", {
    duration: flyInDuration * 0.4,
    ease: "sine.inOut",
    attr: { "flood-opacity": 0.49 }
  }, flyInDuration * 0.6);
}

const textFlyIn = () => {
  const tl = gsap.timeline({ paused: true });
  const loadingShineTL = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.35 });

  document.querySelectorAll(".textChar").forEach((item, i) => {
    loadingShineTL.to(item, {
      duration: 0.35,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 1,
      fill: fontShineColor
    }, 0.15 * i)
  })

  return tl.to("#textPath", {
    duration: flyInDuration,
    ease: "power2.Out",
    attr: { 
      startOffset: textAlign,
      "font-size": fontSizeEnd,
      fill: fontColorEnd
    }
  })
  // virker i FireFox
  .to("#textPathWrapper", { duration: flyInDuration, attr: { textLength: textSpacingEnd }}, 0)
  // virker i Chrome
  .to("#textPath", { duration: flyInDuration, attr: { textLength: textSpacingEnd }}, 0)

  .add(loadingShineTL.play());
}

// fanger de returnerede timelines fra funktionerne
// så de kan blive sat på pause igennem master timeline
// eyesBlink kører uanset om master er sat på pause
const master = gsap.timeline();
const movesTL = moves();
const thrusterTL = thruster();
const flyInTL = flyIn();
const textFlyInTL = textFlyIn();
const armsDownTL = armsDown();

master.add(flyInTL.play(), flyInDelay)
.add(movesTL.play(), "<-0.1")
.add(thrusterTL.play(), "<-0.1")
.add(eyesBlink(), "<")
.add(armsDownTL.play(), flyInDuration)
.add(textFlyInTL.play(), flyInDuration * 0.35);

// til knapperne
const smoothPause = (target, duration = 0.5) => gsap.to(target, {duration, timeScale: 0});
const smoothStart = (target, duration = 0.5) => gsap.to(target, {duration, timeScale: 1});
document.getElementById("smoothStart").onclick = () => smoothStart(master, 0.8);
document.getElementById("smoothPause").onclick = () => smoothPause(master, 0.8);
document.getElementById("pause").onclick = () => master.pause();
document.getElementById("start").onclick = () => master.play();
document.getElementById("restart").onclick = () => master.restart();


