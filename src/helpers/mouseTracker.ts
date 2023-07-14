let prevX = 0;
let prevY = 0;
let speedX = 0;
let speedY = 0;
let currentX = 0;
let currentY = 0;
let timestamp = 0;

const calculateSpeed = () => {
  const deltaX = currentX - prevX;
  const deltaY = currentY - prevY;
  speedX = deltaX;
  speedY = deltaY;
  prevX = currentX;
  prevY = currentY;
};

document.addEventListener("mousemove", (event) => {
  currentX = event.clientX;
  currentY = event.clientY;
  if (new Date().getTime() - timestamp > 100) {
    timestamp = new Date().getTime();
    calculateSpeed();
  }
});

const getMouseSpeedX = () => Math.abs(speedX);
const getMouseSpeedY = () => Math.abs(speedY);

export { getMouseSpeedX, getMouseSpeedY };
