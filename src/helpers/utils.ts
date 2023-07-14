export const getNewInterval = () =>
  ({
    id: Math.random().toString(),
    startPower: 100,
    endPower: 100,
    duration: 5 * 60,
  }) as TInterval;

export const getAveragePower = (intervals: TInterval[]) => {
  let sum = 0;
  intervals.forEach((interval) => {
    sum += ((interval.startPower + interval.endPower) / 2) * interval.duration;
  });
  return sum / getDuration(intervals);
};

export const getDuration = (intervals: TInterval[]) => {
  let sum = 0;
  intervals.forEach((interval) => {
    sum += interval.duration;
  });
  return sum;
};

export const getDurationFormatted = (intervals: TInterval[]) => {
  const duration = getDuration(intervals);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration - hours * 3600) / 60);
  const seconds = duration - hours * 3600 - minutes * 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/*Given an array of cycling Intervals calculate the normalized power of the workout.*/
export const getNP = (intervals: TInterval[]) => {
  const segmentDuration = 10;

  let sum = 0;
  let count = 0;

  intervals.forEach((interval) => {
    const numSegments = Math.floor(interval.duration / segmentDuration);

    for (let i = 0; i < numSegments; i++) {
      const a = (interval.endPower - interval.startPower) / interval.duration;
      const b = interval.startPower;
      const power = a * (i * segmentDuration) + b;
      sum += Math.pow(power, 4) * segmentDuration;
      count += segmentDuration;
    }

    const remainingDuration = interval.duration % segmentDuration;
    if (remainingDuration > 0) {
      const a = (interval.endPower - interval.startPower) / interval.duration;
      const b = interval.startPower;
      const power = a * (numSegments * segmentDuration) + b;
      sum += Math.pow(power, 4) * remainingDuration;
      count += remainingDuration;
    }
  });

  return Math.pow(sum / count, 1 / 4);
};

export const getIF = (intervals: TInterval[]) => getNP(intervals) / 100;

export const getTSS = (intervals: TInterval[]) => ((getIF(intervals) ** 2 * (getDuration(intervals) / 60)) / 60) * 100;

export const getMrcData = (intervals: TInterval[]) => {
  let startingTime = 0;
  let mrcFile = `[COURSE HEADER]
VERSION = 2
UNITS = ENGLISH
DESCRIPTION =
FILE NAME = teste
MINUTES PERCENT
[END COURSE HEADER]
[COURSE DATA]
`;
  intervals.forEach((interval) => {
    let minuts = Math.round((startingTime / 60) * 100) / 100;
    mrcFile += `${minuts.toFixed(2)}\t${interval.startPower}\n`;
    startingTime += interval.duration;
    minuts = Math.round((startingTime / 60) * 100) / 100;
    mrcFile += `${minuts.toFixed(2)}\t${interval.endPower}\n`;
  });
  mrcFile += `[END COURSE DATA]`;
  return mrcFile;
};
