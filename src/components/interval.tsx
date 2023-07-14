import React, { useEffect, useRef } from "react";
import { clamp } from "lodash";
import { Box, Typography } from "@mui/material";
import "./interval.css";
import Grid2 from "@mui/material/Unstable_Grid2";
import { getMouseSpeedX, getMouseSpeedY } from "../helpers/mouseTracker.ts";
import { CONST_MAX_INTERVAL_POWER } from "../helpers/constants.ts";

const CONST_HANDLER_SIZE = 3;
const CONST_MIN_INTERVAL_POWER = CONST_HANDLER_SIZE * 2;
const CONST_MIN_INTERVAL_DURATION = CONST_HANDLER_SIZE * 3;

const zoneColor = ["#808080", "#006fff", "#36bf00", "#e6bf00", "#e67300", "#e60b0b", "#530066"];

const zoneMax = [54, 75, 87, 94, 105, 120, Infinity];

const getColorZone = (value: number) => {
  return zoneColor[getZoneIndex(value)];
};

const getZoneIndex = (value: number) => {
  for (let i = 0; i < zoneMax.length; i++) {
    if (value <= zoneMax[i]) return i;
  }
  return zoneMax.length - 1;
};

const getColorZones = (value1: number, value2?: number) => {
  if (value2 === undefined) return [getColorZone(value1)];
  const index1 = getZoneIndex(value1);
  const index2 = getZoneIndex(value2);
  if (index1 === index2) return [getColorZone(value1)];
  if (index1 > index2) return getColorZonesReverse(value1, value2);
  const colorZones = [];
  for (let i = index1; i <= index2; i++) {
    colorZones.push(zoneColor[i]);
  }
  return colorZones;
};

const getColorZonesReverse = (value1: number, value2?: number) => {
  if (value2 === undefined) return [getColorZone(value1)];
  const index1 = getZoneIndex(value1);
  const index2 = getZoneIndex(value2);
  const colorZones = [];
  for (let i = index1; i >= index2; i--) {
    colorZones.push(zoneColor[i]);
  }
  return colorZones;
};

const BlockStyle = {
  backgroundColor: "white",
  display: "inline-block",
  margin: "0px",
  padding: "0px",
  color: "black",
  borderRadius: "5px",
} as React.CSSProperties;

const cornerLeft = {
  backgroundColor: "#eee",
  height: `${CONST_HANDLER_SIZE}px`,
  width: `${CONST_HANDLER_SIZE}px`,
  margin: "0px",
  padding: "0px",
  position: "absolute",
  left: `0`,
  cursor: "row-resize",
  zIndex: 100,
} as React.CSSProperties;

const cornerRight = {
  ...cornerLeft,
  left: "auto",
  right: `0`,
} as React.CSSProperties;

const topEdge = {
  ...cornerLeft,
  right: "auto",
  left: "50%",
  transform: "translateX(-50%)",
} as React.CSSProperties;

const rightEdge = {
  ...cornerLeft,
  height: `${CONST_HANDLER_SIZE}px`,
  width: `${CONST_HANDLER_SIZE}px`,
  left: "auto",
  right: `0`,
  cursor: "col-resize",
} as React.CSSProperties;

function Interval(props: { dragHandleProps: any; selected: boolean; item: TInterval; onUpdate: (item: TInterval) => void; zoom: number }) {
  const [state, setState] = React.useState({
    startPower: props.item.startPower,
    endPower: props.item.endPower,
    duration: props.item.duration,
  } as Omit<TInterval, "id">);

  const persistedState = useRef({
    lastDelta: 0,
    lastX: 0,
    lastY: 0,
    dragging: false,
  }).current;

  const handleWidthDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    persistedState.dragging = true;
    window.onmousemove = updateWidth;
  };

  const handleHeightDrag = (side: "start" | "end" | "both") => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    persistedState.dragging = true;
    window.onmousemove = updateHeight(side);
  };

  function updateWidth(e: MouseEvent) {
    if (!persistedState.dragging) return;
    let partialDelta = (e.clientX - (persistedState.lastX || e.clientX)) * props.zoom;
    persistedState.lastX = e.clientX;
    if (getMouseSpeedX() < 5) partialDelta = partialDelta / (props.zoom > 1 ? props.zoom + 5 : 5);
    persistedState.lastDelta = persistedState.lastDelta + partialDelta;
    const totalDelta = Math.round(persistedState.lastDelta);
    const newWidth = clamp(state.duration + totalDelta, CONST_MIN_INTERVAL_DURATION, Infinity);
    setState((state) => ({ ...state, duration: newWidth }));
  }

  const updateHeight = (side: "start" | "end" | "both") => (e: MouseEvent) => {
    if (!persistedState.dragging) return;
    let partialDelta = e.clientY - (persistedState.lastY || e.clientY);
    persistedState.lastY = e.clientY;
    if (getMouseSpeedY() < 5) partialDelta = partialDelta / 5;
    persistedState.lastDelta = persistedState.lastDelta + partialDelta;
    const totalDelta = Math.round(persistedState.lastDelta);
    if (side === "both") {
      const startPower = clamp(state.startPower - totalDelta, CONST_MIN_INTERVAL_POWER, CONST_MAX_INTERVAL_POWER);
      const endPower = clamp(state.endPower - totalDelta, CONST_MIN_INTERVAL_POWER, CONST_MAX_INTERVAL_POWER);
      setState((state) => ({ ...state, startPower, endPower }));
    } else {
      const newPower = clamp(state[`${side}Power`] - totalDelta, CONST_MIN_INTERVAL_POWER, CONST_MAX_INTERVAL_POWER);
      setState((state) => ({ ...state, [`${side}Power`]: newPower }));
    }
  };

  useEffect(() => {
    window.addEventListener("mouseup", () => {
      {
        persistedState.lastDelta = 0;
        persistedState.lastX = 0;
        persistedState.lastY = 0;
        persistedState.dragging = false;
        window.onmousemove = null;
      }
    });
  }, []);

  props.onUpdate({ ...props.item, ...state });
  const topEdgeHeight = Math.min(state.startPower, state.endPower) + Math.abs(state.startPower - state.endPower) / 2;
  const rightEdgeHeight = state.endPower / 2;

  const mins = Math.floor(state.duration / 60);
  const secs = state.duration % 60;
  const power = `${state.startPower}%` + `${state.startPower !== state.endPower ? ` ${state.endPower}%` : ""}`;
  const title = `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs} ${power}`;
  const duration = `${state.duration / props.zoom}px`;
  let backgroundColor = `linear-gradient(to right, ${getColorZones(state.startPower, state.endPower)
    .map((color, i, arr) => `${color} ${(i / (arr.length - 1)) * 100}%`)
    .join(", ")})`;
  if (getZoneIndex(state.startPower) === getZoneIndex(state.endPower)) {
    backgroundColor = zoneColor[getZoneIndex(state.startPower)];
  }

  return (
    <Box sx={{ position: "relative", width: duration }}>
      <Box sx={{ ...topEdge, bottom: `${topEdgeHeight}px` }} onMouseDown={handleHeightDrag("both")}></Box>
      <Box sx={{ ...cornerLeft, bottom: `${state.startPower}px` }} onMouseDown={handleHeightDrag("start")}></Box>
      <Box sx={{ ...cornerRight, bottom: `${state.endPower}px` }} onMouseDown={handleHeightDrag("end")}></Box>
      <Box sx={{ ...rightEdge, bottom: `${rightEdgeHeight}px` }} onMouseDown={handleWidthDrag}></Box>
      <Box
        className={"inteval-block"}
        {...props.dragHandleProps}
        sx={{
          ...BlockStyle,
          height: `${CONST_MAX_INTERVAL_POWER}px`,
          width: duration,
          background: backgroundColor,
          boxShadow: props.selected ? "inset 0 0 6px #ccc" : "inset 0 0 6px #222",
          border: props.selected ? "3px solid #ccc" : "none",
          clipPath: `polygon(0 ${CONST_MAX_INTERVAL_POWER - state.startPower}px, 100% ${CONST_MAX_INTERVAL_POWER - state.endPower}px,500% 100%, 0 100%)`,
        }}
      ></Box>
      <Grid2 container justifyContent='center' alignItems='center' position={"absolute"} top='100%' right={0} left={0}>
        <Typography sx={{ writingMode: `${state.duration < 50 ? "vertical-rl" : "horizontal-tb"}` }} variant={"caption"} color={"white"} textAlign={"center"}>
          {title}
        </Typography>
      </Grid2>
    </Box>
  );
}

export default Interval;
