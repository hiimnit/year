import { useMemo, useState } from "react";
import * as d3 from "d3";
import {
  eachDayOfInterval,
  getDayOfYear,
  lastDayOfYear,
  startOfYear,
} from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { isBefore } from "date-fns/fp";
import clsx from "clsx";

interface DatePoint {
  date: Date;
  row: number;
  col: number;
  isBeforeToday: boolean;
}

function App() {
  const dates = useMemo(() => {
    const today = Date.now();

    const dates = eachDayOfInterval({
      start: startOfYear(today),
      end: lastDayOfYear(today),
    });

    return dates.map(
      (date): DatePoint => ({
        date,
        row: Math.floor((getDayOfYear(date) - 1) / 19),
        col: (getDayOfYear(date) - 1) % 19,
        isBeforeToday: isBefore(today, date),
      }),
    );
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-[calc(min(100vh,100vw))] w-[calc(min(100vh,100vw))]">
        <div className="h-full w-full sm:p-4 md:p-8">
          <Graph dates={dates} />
        </div>
      </div>
    </div>
  );
}

const margin = {
  left: 10,
  top: 10,
  right: 10,
  bottom: 10,
} as const;

const height = 200;
const width = 200;

function Graph({ dates }: { dates: DatePoint[] }) {
  const [selectedDate, setSeletedDate] = useState<Date | null>(null);
  const formattedSelectedDate =
    selectedDate === null
      ? null
      : new Intl.DateTimeFormat(undefined, {
          dateStyle: "full",
          timeStyle: undefined,
        }).format(selectedDate);

  const xscale = d3
    .scaleLinear()
    .domain([0, 18])
    .range([margin.left, width - margin.right]);
  const yscale = d3
    .scaleLinear()
    .domain([0, 19])
    .range([margin.top, height - margin.bottom]);

  const line = d3
    .line<DatePoint>()
    .y((datePoint) => yscale(datePoint.row))
    .x((datePoint) =>
      xscale(datePoint.row % 2 == 0 ? datePoint.col : 18 - datePoint.col),
    );

  const d = line(dates.filter(({ isBeforeToday }) => isBeforeToday));

  const dayOfyear = getDayOfYear(new Date());
  const pathDuration = 0.4 + (dayOfyear / dates.length) * 5;

  return (
    <svg className="bg-slate-950" viewBox={`0 0 ${width} ${height}`}>
      <motion.path
        d={d ?? undefined}
        fill="none"
        strokeWidth="1"
        stroke="currentColor"
        className="text-slate-800"
        strokeDasharray="1"
        pathLength="1"
        initial={{ strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: pathDuration, ease: "easeOut", delay: 0.5 }}
      />

      {dates.map(({ row, col, isBeforeToday, date }, i) => {
        return (
          <motion.circle
            key={i}
            r="1"
            strokeWidth=".25"
            stroke="currentColor"
            cx={xscale(row % 2 == 0 ? col : 18 - col)}
            cy={yscale(row)}
            className={clsx(
              "origin-center transition-transform duration-300 transform-fill hover:transform-[scale(1.75)]",
              {
                "fill-slate-100 text-slate-100 hover:text-slate-50":
                  !isBeforeToday,
                "fill-slate-950 text-slate-500 hover:text-slate-300":
                  isBeforeToday,
              },
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: row * 0.1 }}
            onPointerEnter={() => setSeletedDate(date)}
            onPointerLeave={() => setSeletedDate(null)}
          />
        );
      })}

      <AnimatePresence>
        {formattedSelectedDate && (
          <motion.g
            key={formattedSelectedDate}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <rect
              className="fill-slate-300"
              width={`${formattedSelectedDate.length * 0.36}ex`}
              height="0.4rem"
              fill="currentColor"
              y={height - 7.5}
              x={margin.right - 2}
            />
            <text
              className="fill-slate-700 font-mono text-[.3rem]"
              y={height - 4}
              x={margin.right - 1}
              alignmentBaseline="middle"
            >
              {formattedSelectedDate}
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      <motion.text
        className="fill-slate-700 font-mono text-[.3rem]"
        y={height - margin.bottom}
        x={margin.right - 1}
        alignmentBaseline="middle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        {dayOfyear} / {dates.length}
      </motion.text>
    </svg>
  );
}

export default App;
