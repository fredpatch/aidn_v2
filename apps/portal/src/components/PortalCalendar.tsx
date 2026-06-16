import { ChevronLeft, ChevronRight, Clock, Eye, MapPin, Printer } from "lucide-react";
import { useMemo, useState } from "react";

export type PortalCalendarEvent = {
  id: string;
  title: string;
  date: string;
  timeLabel: string;
  location?: string;
  status: string;
  dossierNumber?: string;
};

type PortalCalendarProps = {
  events: PortalCalendarEvent[];
  onPrintEvent?: (eventId: string) => void;
  onViewEvent?: (eventId: string) => void;
};

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);

const dateLabel = (dateKey: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fromDateKey(dateKey));

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addMonths = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const getCalendarDays = (month: Date) => {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const leadingDays = (first.getDay() + 6) % 7;
  const days: Date[] = [];

  for (let index = leadingDays; index > 0; index -= 1) {
    days.push(new Date(first.getFullYear(), first.getMonth(), 1 - index));
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    days.push(new Date(first.getFullYear(), first.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    const next = days.length - leadingDays - last.getDate() + 1;
    days.push(new Date(last.getFullYear(), last.getMonth() + 1, next));
  }

  return days;
};

function EventCard({
  event,
  compact = false,
  onPrint,
  onView,
}: {
  event: PortalCalendarEvent;
  compact?: boolean;
  onPrint?: (eventId: string) => void;
  onView?: (eventId: string) => void;
}): React.JSX.Element {
  return (
    <div
      className={`rounded-md border border-slate-200 bg-white text-left shadow-sm ${
        compact ? "px-2 py-1.5" : "px-3 py-2"
      }`}
    >
      <p
        className={`font-bold text-slate-950 ${
          compact ? "line-clamp-1 text-[11px]" : "line-clamp-2 text-xs"
        }`}
      >
        {event.title}
      </p>
      <div
        className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-slate-500 ${
          compact ? "text-[10px]" : "text-[11px]"
        }`}
      >
        <span className="inline-flex items-center gap-1">
          <Clock size={compact ? 10 : 12} aria-hidden="true" />
          {event.timeLabel}
        </span>
        {!compact && event.location ? (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} aria-hidden="true" />
            {event.location}
          </span>
        ) : null}
      </div>
      <p
        className={`mt-1 line-clamp-1 font-semibold text-slate-500 ${
          compact ? "text-[10px]" : "text-[11px]"
        }`}
      >
        {event.status}
        {event.dossierNumber ? ` · ${event.dossierNumber}` : ""}
      </p>
      {!compact ? (
        <div className="no-print mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary min-h-8 px-2 py-1 text-xs"
            onClick={() => onView?.(event.id)}
          >
            <Eye size={13} aria-hidden="true" />
            Voir la convocation
          </button>
          <button
            type="button"
            className="btn btn-secondary min-h-8 px-2 py-1 text-xs"
            onClick={() => onPrint?.(event.id)}
          >
            <Printer size={13} aria-hidden="true" />
            Imprimer
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PortalCalendar({
  events,
  onPrintEvent,
  onViewEvent,
}: PortalCalendarProps): React.JSX.Element {
  const initialMonth = events.find((event) => event.date)?.date;
  const [visibleMonth, setVisibleMonth] = useState(() =>
    initialMonth ? fromDateKey(initialMonth) : new Date(),
  );
  const [selectedDate, setSelectedDate] = useState(
    initialMonth ?? toDateKey(new Date()),
  );

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, PortalCalendarEvent[]>();
    events.forEach((event) => {
      const current = grouped.get(event.date) ?? [];
      current.push(event);
      grouped.set(event.date, current);
    });
    grouped.forEach((items) =>
      items.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel, "fr")),
    );
    return grouped;
  }, [events]);

  const days = getCalendarDays(visibleMonth);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  return (
    <section className="surface overflow-hidden rounded-lg">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold capitalize text-slate-950">
            {monthLabel(visibleMonth)}
          </h2>
          <p className="text-sm text-slate-500">
            Calendrier en lecture seule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary size-10 p-0"
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
            aria-label="Mois précédent"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-secondary size-10 p-0"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
            aria-label="Mois suivant"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase text-slate-500">
          {dayLabels.map((day) => (
            <div key={day} className="px-2 py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = toDateKey(day);
            const dayEvents = eventsByDate.get(key) ?? [];
            const hasEvents = dayEvents.length > 0;
            const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
            const isToday = key === toDateKey(new Date());

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={`min-h-28 border-b border-r p-1.5 text-left transition-colors hover:bg-sky-50 xl:min-h-32 ${
                  key === selectedDate
                    ? "border-sky-200 bg-sky-50 ring-1 ring-inset ring-sky-200"
                    : hasEvents
                      ? "border-sky-100 bg-sky-50/70"
                      : "border-slate-100 bg-white"
                }`}
              >
                <span
                  className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-extrabold ${
                    isToday
                      ? "bg-slate-950 text-white"
                      : hasEvents && isCurrentMonth
                        ? "bg-sky-100 text-sky-800"
                      : isCurrentMonth
                        ? "text-slate-800"
                        : "text-slate-300"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1.5 flex flex-col gap-1">
                  {dayEvents.slice(0, 1).map((event) => (
                    <EventCard key={event.id} event={event} compact />
                  ))}
                  {dayEvents.length > 1 ? (
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                      +{dayEvents.length - 1} autre
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 md:hidden">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-slate-500">
          {dayLabels.map((day) => (
            <span key={day}>{day}</span>
          ))}
          {days.map((day) => {
            const key = toDateKey(day);
            const hasEvents = (eventsByDate.get(key) ?? []).length > 0;
            const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={`relative flex aspect-square items-center justify-center rounded-md text-sm font-extrabold ${
                  key === selectedDate
                    ? "bg-slate-950 text-white"
                    : hasEvents && isCurrentMonth
                      ? "bg-sky-100 text-sky-800"
                    : isCurrentMonth
                      ? "bg-slate-50 text-slate-800"
                      : "bg-white text-slate-300"
                }`}
              >
                {day.getDate()}
                {hasEvents ? (
                  <span className="absolute bottom-1 size-1.5 rounded-full bg-sky-500" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-extrabold capitalize text-slate-950">
          {dateLabel(selectedDate)}
        </p>
        {selectedEvents.length > 0 ? (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {selectedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPrint={onPrintEvent}
                onView={onViewEvent}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm font-medium text-slate-500">
            Aucun rendez-vous ce jour.
          </p>
        )}
      </div>
    </section>
  );
}
