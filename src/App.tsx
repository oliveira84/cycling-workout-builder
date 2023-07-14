import "./App.css";
import { Box, IconButton, Slider, Stack, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Grid2 from "@mui/material/Unstable_Grid2";
import { useRef, useState } from "react";
import Interval from "./components/interval.tsx";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { CONST_MAX_INTERVAL_POWER } from "./helpers/constants.ts";
import { getDurationFormatted, getIF, getMrcData, getNewInterval, getTSS } from "./helpers/utils.ts";
import { cloneDeep } from "lodash";
import DownloadIcon from "@mui/icons-material/Download";

function App() {
  const [state, setState] = useState({
    selectedIntervalID: undefined as string | undefined,
    zoom: 1,
  });

  const persistedState = useRef({
    intervals: [] as TInterval[],
    timeOutRef: undefined as number | undefined,
  }).current;

  const handleAddInterval = () => {
    const currentIndex = persistedState.intervals.findIndex((item) => item.id === state.selectedIntervalID) ?? 0;
    persistedState.intervals = [...persistedState.intervals.slice(0, currentIndex + 1), getNewInterval(), ...persistedState.intervals.slice(currentIndex + 1)];
    setState((state) => ({
      ...state,
      selectedIntervalID: persistedState.intervals[currentIndex + 1].id,
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(persistedState.intervals);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    persistedState.intervals = items;
    setState((state) => ({
      ...state,
    }));
  };

  const handleClick = (id: string) => () => {
    setState((state) => ({
      ...state,
      selectedIntervalID: id,
    }));
  };

  // @ts-ignore
  const handleZoomChange = (event: Event, value: number | number[], activeThumb: number) => {
    setState((state) => ({
      ...state,
      zoom: 5 - (value as number),
    }));
  };

  const handleDuplicateInterval = () => {
    const currentSelectedIndex = persistedState.intervals.findIndex((item) => item.id === state.selectedIntervalID) ?? 0;
    const newItem = cloneDeep(persistedState.intervals[currentSelectedIndex]);
    newItem.id = Math.random().toString();
    console.log("newItem", newItem);
    persistedState.intervals = [
      ...persistedState.intervals.slice(0, currentSelectedIndex + 1),
      newItem,
      ...persistedState.intervals.slice(currentSelectedIndex + 1),
    ];
    setState((state) => ({
      ...state,
      selectedInterval: newItem.id,
    }));
  };

  const handleDeleteInterval = () => {
    const currentIndex = persistedState.intervals.findIndex((item) => item.id === state.selectedIntervalID);
    persistedState.intervals = persistedState.intervals.filter((item) => item.id !== state.selectedIntervalID);
    setState((state) => ({
      ...state,
      selectedInterval: persistedState.intervals[currentIndex - 1]?.id ?? undefined,
    }));
  };

  const handleDownload = () => {
    const mrcData = getMrcData(persistedState.intervals);
    const blob = new Blob([mrcData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "intervals.mrc";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateInterval = (interval: TInterval) => {
    const currentIndex = persistedState.intervals.findIndex((item) => item.id === interval.id);
    persistedState.intervals[currentIndex] = interval;
    persistedState.timeOutRef && clearTimeout(persistedState.timeOutRef);
    persistedState.timeOutRef = setTimeout(() => {
      setState((state) => ({
        ...state,
      }));
    }, 250);
  };

  return (
    <Box height={"100vh"} width={"100vw"} padding={"25px 20px"}>
      <Grid2 container justifyContent={"space-between"} alignItems={"center"} direction={"column"} height={"100%"}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={"intervals"} direction={"horizontal"} type={"interval"}>
            {(provided) => (
              <Box className={"intervals-container"} height={`${CONST_MAX_INTERVAL_POWER + 150}px`} {...provided.droppableProps} ref={provided.innerRef}>
                {persistedState.intervals.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div {...provided.draggableProps} ref={provided.innerRef} onClick={handleClick(item.id)}>
                        <Interval
                          key={item.id}
                          dragHandleProps={{ ...provided.dragHandleProps }}
                          selected={state.selectedIntervalID === item.id}
                          item={item}
                          onUpdate={handleUpdateInterval}
                          zoom={state.zoom}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
        <Grid2 container justifyContent={"space-between"} alignItems={"center"} direction={"row"} width={"100%"}>
          <Grid2 container justifyContent={"center"} alignItems={"center"} direction={"row"}>
            <IconButton onClick={handleAddInterval}>
              <AddIcon sx={{ fontSize: "25px", color: "white" }} />
            </IconButton>
            <IconButton onClick={handleDeleteInterval}>
              <DeleteIcon sx={{ fontSize: "25px", color: "white" }} />
            </IconButton>
            <IconButton onClick={handleDuplicateInterval}>
              <ContentCopyIcon sx={{ fontSize: "25px", color: "white" }} />
            </IconButton>
            <IconButton onClick={handleDownload}>
              <DownloadIcon sx={{ fontSize: "25px", color: "white" }} />
            </IconButton>
          </Grid2>
          <Grid2 container direction='column' alignItems='center' justifyContent={"center"} spacing={1}>
            <Typography variant={"caption"}>TSS: {Math.round(getTSS(persistedState.intervals))}</Typography>
            <Typography variant={"caption"}>IF: {Math.round(getIF(persistedState.intervals) * 100) / 100}</Typography>
            <Typography variant={"caption"}>Time: {getDurationFormatted(persistedState.intervals)} </Typography>
          </Grid2>
          <Stack direction='row' alignItems='center' width={"180px"} justifyContent={"center"} spacing={1} margin={"0 20px"}>
            <Typography variant={"caption"}>Zoom</Typography>
            <Slider size={"small"} valueLabelDisplay='auto' defaultValue={4} marks min={1} max={4} onChange={handleZoomChange} />
          </Stack>
        </Grid2>
      </Grid2>
    </Box>
  );
}

export default App;
