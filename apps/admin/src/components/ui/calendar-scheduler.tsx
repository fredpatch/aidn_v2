import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CalendarSchedulerProps {
  timeSlots?: string[];
  onConfirm?: (value: { date?: Date; time?: string }) => void;
  /** Called on every date/time selection change - use for controlled/dialog contexts */
  onChange?: (value: { date?: Date; time?: string }) => void;
  /** Hide the built-in Reset/Confirm footer when embedding inside a dialog */
  showFooter?: boolean;
  title?: string;
}

function CalendarScheduler({
  timeSlots = [
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ],
  onConfirm,
  onChange,
  showFooter = true,
  title = "Planifier une réunion",
}: CalendarSchedulerProps) {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [time, setTime] = React.useState<string | undefined>();

  const handleDateSelect = (d: Date | undefined) => {
    setDate(d);
    onChange?.({ date: d, time });
  };

  const handleTimeSelect = (slot: string) => {
    setTime(slot);
    onChange?.({ date, time: slot });
  };

  const handleReset = () => {
    setDate(undefined);
    setTime(undefined);
    onChange?.({ date: undefined, time: undefined });
  };

  return (
    <Card className="w-full shadow-none border-none bg-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-3 p-3 pt-0">
        {/* Calendar */}
        <div className="flex-1 rounded-md border p-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={{ before: new Date() }}
            className="rounded-md"
          />
        </div>

        {/* Time slots */}
        <div className="w-40 shrink-0 overflow-y-auto rounded-md border p-2">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Heure
          </p>
          <div className="flex flex-col gap-1">
            {timeSlots.map((slot) => (
              <Button
                key={slot}
                type="button"
                variant={time === slot ? "default" : "outline"}
                size="sm"
                className={cn(
                  "w-full justify-center text-xs",
                  time === slot && "ring-2 ring-primary ring-offset-1",
                )}
                onClick={() => handleTimeSelect(slot)}
              >
                {slot}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>

      {showFooter ? (
        <CardFooter className="flex justify-between px-3 pb-3 pt-0">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Réinitialiser
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onConfirm?.({ date, time })}
            disabled={!date || !time}
          >
            Confirmer
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export { CalendarScheduler };
