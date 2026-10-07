import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  UserRound,
  UsersRound,
  ArrowRightLeft,
  CalendarClock,
  MapPin,
} from "lucide-react";
import { timetableApi } from "../api/timetable.api";

/* -------------------------------------------------------------------------- */
/*                          SMALL COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

const EmptyPeriod = () => (
  <div className="h-full min-h-[92px] flex items-center justify-center">
    <span className="text-xs text-slate-600">—</span>
  </div>
);

const TimetableCell = ({ data, isMyPeriod = false }) => {
  if (!data) return <EmptyPeriod />;

  return (
    <div
      className={`min-h-[92px] rounded-xl border p-3 ${
        isMyPeriod
          ? "border-blue-500/30 bg-blue-500/10"
          : "border-slate-700/70 bg-slate-800/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-100 text-sm">{data.subject}</p>
          {data.className && (
            <p className="mt-1 text-xs text-slate-400">{data.className}</p>
          )}
        </div>

        {isMyPeriod && (
          <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
            YOU
          </span>
        )}
      </div>

      {data.teacher && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <UserRound size={13} />
          <span>{data.teacher}</span>
        </div>
      )}

      {data.room && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={13} />
          <span>{data.room}</span>
        </div>
      )}
    </div>
  );
};

const ChangeCard = ({ change, type }) => {
  const isSubstitution = type === "substitution";

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              isSubstitution
                ? "bg-amber-500/10 text-amber-400"
                : "bg-purple-500/10 text-purple-400"
            }`}
          >
            {isSubstitution ? (
              <ArrowRightLeft size={17} />
            ) : (
              <CalendarClock size={17} />
            )}
          </div>

          <div>
            <p className="font-medium text-slate-100">{change.subject}</p>
            <p className="text-xs text-slate-400">
              {change.className} · Period {change.period}
            </p>
          </div>
        </div>

        <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400">
          {change.date}
        </span>
      </div>

      <div className="mt-4 border-t border-slate-700/70 pt-3">
        {isSubstitution ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-400">{change.originalTeacher}</span>
            <ArrowRightLeft size={14} className="text-slate-500" />
            <span className="font-medium text-amber-300">
              {change.substituteTeacher}
            </span>
          </div>
        ) : (
          <p className="text-sm text-slate-300">{change.reason}</p>
        )}

        {change.room && (
          <p className="mt-2 text-xs text-slate-500">{change.room}</p>
        )}

        {isSubstitution && (
          <p className="mt-2 text-xs text-slate-500">Reason: {change.reason}</p>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                            SKELETONS                                       */
/* -------------------------------------------------------------------------- */

const GridSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
    <div className="animate-pulse p-6 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-slate-800/60" />
      ))}
    </div>
  </div>
);

const ErrorBox = ({ message, onRetry }) => (
  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center justify-between gap-3">
    <span>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="rounded-md border border-red-400/40 px-3 py-1 text-xs hover:bg-red-500/20"
      >
        Retry
      </button>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

const StaffTimetable = () => {
  const [activeView, setActiveView] = useState("my");

  /* ---------- My timetable state ---------- */
  const [myData, setMyData] = useState(null);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState(null);

  /* ---------- Class list + class timetable state ---------- */
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [classData, setClassData] = useState(null);
  const [classLoading, setClassLoading] = useState(false);
  const [classError, setClassError] = useState(null);

  /* ---------- Changes state ---------- */
  const [changes, setChanges] = useState(null);
  const [changesLoading, setChangesLoading] = useState(false);
  const [changesError, setChangesError] = useState(null);

  /* ------------------------------------------------------------------ */
  /* Loaders                                                             */
  /* ------------------------------------------------------------------ */

  const loadMyTimetable = async () => {
    try {
      setMyLoading(true);
      setMyError(null);
      const data = await timetableApi.getMyTimetable();
      setMyData(data);
    } catch (err) {
      setMyError(err?.message || "Failed to load your timetable");
    } finally {
      setMyLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await timetableApi.getClasses();
      setClasses(data);
      if (data.length && !selectedClass) setSelectedClass(data[0].id);
    } catch (err) {
      setClassError(err?.message || "Failed to load classes");
    }
  };

  const loadClassTimetable = async (standardId) => {
    if (!standardId) return;
    try {
      setClassLoading(true);
      setClassError(null);
      const data = await timetableApi.getClassTimetable(standardId);
      setClassData(data);
    } catch (err) {
      setClassError(err?.message || "Failed to load class timetable");
    } finally {
      setClassLoading(false);
    }
  };

  const loadChanges = async () => {
    try {
      setChangesLoading(true);
      setChangesError(null);
      const data = await timetableApi.getChanges();
      setChanges(data);
    } catch (err) {
      setChangesError(err?.message || "Failed to load changes");
    } finally {
      setChangesLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Effects                                                             */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (activeView === "my" && !myData) loadMyTimetable();
  }, [activeView]); // eslint-disable-line

  useEffect(() => {
    if (activeView === "class" && classes.length === 0) loadClasses();
  }, [activeView]); // eslint-disable-line

  useEffect(() => {
    if (activeView === "class" && selectedClass && !classData) {
      loadClassTimetable(selectedClass);
    }
  }, [activeView, selectedClass]); // eslint-disable-line

  useEffect(() => {
    if (activeView === "changes" && !changes) loadChanges();
  }, [activeView]); // eslint-disable-line

  const handleClassChange = (e) => {
    const id = e.target.value;
    setSelectedClass(id);
    setClassData(null);
    loadClassTimetable(id);
  };

  /* ------------------------------------------------------------------ */
  /* Derived                                                             */
  /* ------------------------------------------------------------------ */

  const weekdays = myData?.weekdays || classData?.weekdays || [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ];

  const weekdayLabels = myData?.weekdayLabels ||
    classData?.weekdayLabels || {
      MONDAY: "Monday",
      TUESDAY: "Tuesday",
      WEDNESDAY: "Wednesday",
      THURSDAY: "Thursday",
      FRIDAY: "Friday",
    };

  const periods = useMemo(
    () => myData?.periods || classData?.periods || [],
    [myData, classData]
  );

  const selectedClassName =
    classes.find((c) => c.id === selectedClass)?.name || "";

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CalendarDays size={16} />
                <span>
                  Academic Year {myData?.academicYear?.name || "—"}
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Timetable
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                View class schedules, your teaching periods, and timetable
                changes.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              <Clock3 size={16} className="text-slate-400" />
              <div>
                <p className="text-[11px] text-slate-500">Today</p>
                <p className="text-sm font-medium text-slate-200">
                  {todayLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-800">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: "my", label: "My Timetable", icon: UserRound },
              { key: "class", label: "Class Timetable", icon: UsersRound },
              { key: "changes", label: "Changes", icon: ArrowRightLeft },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  activeView === key
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* MY TIMETABLE                                                      */}
        {/* ---------------------------------------------------------------- */}
        {activeView === "my" && (
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold">My Weekly Timetable</h2>
              <p className="mt-1 text-sm text-slate-400">
                Periods assigned to you across all classes.
              </p>
            </div>

            {myLoading && <GridSkeleton />}
            {myError && !myLoading && (
              <ErrorBox message={myError} onRetry={loadMyTimetable} />
            )}

            {myData && !myLoading && !myError && (
              <>
                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { label: "Weekly periods", value: myData.summary.weeklyPeriods },
                    { label: "Classes", value: myData.summary.classes },
                    { label: "Subjects", value: myData.summary.subjects },
                    { label: "Today", value: myData.summary.today },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                    >
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                  <div className="overflow-x-auto">
                    <div className="min-w-[1050px]">
                      <div className="grid grid-cols-[90px_repeat(5,minmax(180px,1fr))] border-b border-slate-800">
                        <div className="flex items-center justify-center border-r border-slate-800 p-3 text-xs font-medium text-slate-500">
                          Period
                        </div>
                        {weekdays.map((day) => (
                          <div
                            key={day}
                            className="border-r border-slate-800 p-3 last:border-r-0"
                          >
                            <p className="text-sm font-medium text-slate-200">
                              {weekdayLabels[day]}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {Object.keys(myData.timetable[day] || {}).length}{" "}
                              periods
                            </p>
                          </div>
                        ))}
                      </div>

                      {periods.map((period) => (
                        <div
                          key={period.id}
                          className="grid grid-cols-[90px_repeat(5,minmax(180px,1fr))] border-b border-slate-800 last:border-b-0"
                        >
                          <div className="border-r border-slate-800 p-3">
                            <p className="text-sm font-semibold text-slate-300">
                              P{period.index}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {period.startTime}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {period.endTime}
                            </p>
                          </div>

                          {weekdays.map((day) => (
                            <div
                              key={`${day}-${period.id}`}
                              className="border-r border-slate-800 p-2 last:border-r-0"
                            >
                              <TimetableCell
                                data={myData.timetable[day]?.[period.index]}
                                isMyPeriod
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CLASS TIMETABLE                                                   */}
        {/* ---------------------------------------------------------------- */}
        {activeView === "class" && (
          <section>
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-lg font-semibold">Class Timetable</h2>
                <p className="mt-1 text-sm text-slate-400">
                  View the complete normal timetable for a class.
                </p>
              </div>

              <div className="relative w-full md:w-56">
                <select
                  value={selectedClass}
                  onChange={handleClassChange}
                  className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 pr-9 text-sm text-slate-200 outline-none transition focus:border-blue-500"
                >
                  {classes.length === 0 && <option>Loading…</option>}
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>

            {selectedClassName && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <UsersRound size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Selected class</p>
                  <p className="font-semibold text-slate-100">
                    {selectedClassName}
                  </p>
                </div>
              </div>
            )}

            {classLoading && <GridSkeleton />}
            {classError && !classLoading && (
              <ErrorBox
                message={classError}
                onRetry={() => loadClassTimetable(selectedClass)}
              />
            )}

            {classData && !classLoading && !classError && (
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <div className="overflow-x-auto">
                  <div className="min-w-[1050px]">
                    <div className="grid grid-cols-[90px_repeat(5,minmax(180px,1fr))] border-b border-slate-800">
                      <div className="flex items-center justify-center border-r border-slate-800 p-3 text-xs font-medium text-slate-500">
                        Period
                      </div>
                      {weekdays.map((day) => (
                        <div
                          key={day}
                          className="border-r border-slate-800 p-3 last:border-r-0"
                        >
                          <p className="text-sm font-medium text-slate-200">
                            {weekdayLabels[day]}
                          </p>
                        </div>
                      ))}
                    </div>

                    {periods.map((period) => (
                      <div
                        key={period.id}
                        className="grid grid-cols-[90px_repeat(5,minmax(180px,1fr))] border-b border-slate-800 last:border-b-0"
                      >
                        <div className="border-r border-slate-800 p-3">
                          <p className="text-sm font-semibold text-slate-300">
                            P{period.index}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {period.startTime}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {period.endTime}
                          </p>
                        </div>

                        {weekdays.map((day) => (
                          <div
                            key={`${day}-${period.id}`}
                            className="border-r border-slate-800 p-2 last:border-r-0"
                          >
                            <TimetableCell
                              data={classData.timetable[day]?.[period.index]}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CHANGES                                                           */}
        {/* ---------------------------------------------------------------- */}
        {activeView === "changes" && (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Timetable Changes</h2>
              <p className="mt-1 text-sm text-slate-400">
                Date-specific timetable entries and substitutions.
              </p>
            </div>

            {changesLoading && <GridSkeleton />}
            {changesError && !changesLoading && (
              <ErrorBox message={changesError} onRetry={loadChanges} />
            )}

            {changes && !changesLoading && !changesError && (
              <>
                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                      <CalendarClock size={16} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-200">
                        Date-specific timetable
                      </h3>
                      <p className="text-xs text-slate-500">
                        Changes to the normal timetable for a specific date.
                      </p>
                    </div>
                  </div>

                  {changes.dateSpecific.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No date-specific changes.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {changes.dateSpecific.map((change) => (
                        <ChangeCard
                          key={change.id}
                          change={change}
                          type="date-specific"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <ArrowRightLeft size={16} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-200">
                        Substitutions
                      </h3>
                      <p className="text-xs text-slate-500">
                        Staff substitutions affecting timetable periods.
                      </p>
                    </div>
                  </div>

                  {changes.substitutions.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No substitutions.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {changes.substitutions.map((change) => (
                        <ChangeCard
                          key={change.id}
                          change={change}
                          type="substitution"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default StaffTimetable;