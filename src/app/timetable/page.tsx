
"use client";
import React, { useState, useEffect, Suspense, useCallback, useActionState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Edit3, CalendarClock, ListChecks, MailCheck, Eye, Info, Repeat, Calendar as CalendarIcon, List } from "lucide-react";
import { useAppStore, type DesiredFormatType } from '@/lib/store';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO, startOfDay, isEqual, addDays, isSameMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { scheduleEmailNotificationAction, type ScheduleEmailNotificationFormState } from '@/lib/actions';
import { auth } from '@/lib/firebase';
import { Calendar } from "@/components/ui/calendar"; // ShadCN Calendar

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
const daysOfWeek: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayMapping: Record<DayOfWeek, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };


type RepeatType = 'none' | 'daily' | 'weekly';

interface RepeatSetting {
  type: RepeatType;
  days?: DayOfWeek[]; // Only for 'weekly'
}

interface TimetableEvent {
  id: string;
  title: string;
  description: string;
  date: string; // "yyyy-MM-dd"
  time: string;
  associatedResult?: string;
  originalFormat?: DesiredFormatType | string | null;
  notifyByEmail?: boolean;
  repeat?: RepeatSetting;
}

interface QAItem {
  Question: string | null | undefined;
  Answer: string | null | undefined;
}

const initialScheduleEmailState: ScheduleEmailNotificationFormState = {
  message: null,
  errors: {},
};

type ViewMode = 'list' | 'calendar';

export default function TimetablePage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4 text-center">Loading timetable...</div>}>
      <TimetableContent />
    </Suspense>
  );
}

function TimetableContent() {
  const { aiResult, isLoggedIn, isSubscribed, lastAiInput } = useAppStore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimetableEvent | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(''); // Stores "yyyy-MM-dd"
  const [time, setTime] = useState('');
  const [notifyByEmail, setNotifyByEmail] = useState(false);
  const [associatedResultText, setAssociatedResultText] = useState('');
  const [currentOriginalFormat, setCurrentOriginalFormat] = useState<DesiredFormatType | string | null | undefined>(null);
  
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [selectedWeeklyDays, setSelectedWeeklyDays] = useState<DayOfWeek[]>([]);

  const [viewResultModalContent, setViewResultModalContent] = useState<string | null>(null);
  const [viewResultModalOriginalFormat, setViewResultModalOriginalFormat] = useState<string | null | DesiredFormatType>(null);
  const [isViewResultModalOpen, setIsViewResultModalOpen] = useState(false);

  const [scheduleEmailState, runScheduleEmailAction, isSchedulingEmail] = useActionState(scheduleEmailNotificationAction, initialScheduleEmailState);
  const [, startScheduleEmailTransition] = useTransition();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());


   useEffect(() => {
    if (isLoggedIn) {
      const storedEvents = localStorage.getItem('timetableEvents');
      if (storedEvents) {
        try {
            const parsedEvents = JSON.parse(storedEvents) as TimetableEvent[];
            if (Array.isArray(parsedEvents)) {
                 setEvents(parsedEvents.filter(event => event && typeof event.id === 'string')); 
            }
        } catch (e) {
            console.error("Failed to parse timetable events from localStorage", e);
            localStorage.removeItem('timetableEvents'); 
        }
      }
    } else {
      setEvents([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && events.length > 0) {
      localStorage.setItem('timetableEvents', JSON.stringify(events));
    } else if (isLoggedIn && events.length === 0) {
      if (localStorage.getItem('timetableEvents')) {
        localStorage.removeItem('timetableEvents');
      }
    }
  }, [events, isLoggedIn]);

  useEffect(() => {
    if (scheduleEmailState?.message) {
        toast({
            title: scheduleEmailState.errors && Object.keys(scheduleEmailState.errors).length > 0 ? "Notification Setup Error" : "Notification Setup",
            description: scheduleEmailState.message,
            variant: scheduleEmailState.errors && Object.keys(scheduleEmailState.errors).length > 0 ? "destructive" : "default",
            className: scheduleEmailState.errors && Object.keys(scheduleEmailState.errors).length === 0 ? "bg-blue-500/10 border-blue-500" : undefined,
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleEmailState]);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setNotifyByEmail(false);
    setAssociatedResultText('');
    setCurrentOriginalFormat(null);
    setRepeatType('none');
    setSelectedWeeklyDays([]);
    setEditingEvent(null);
    setIsFormOpen(false);
  }, []);


  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'schedule_result' && aiResult?.result && lastAiInput && !isFormOpen && !editingEvent) {
      toast({
        title: "Scheduling AI Result",
        description: "Event details pre-filled from your AI result.",
      });

      setTitle(lastAiInput.subjectTitle ? `Review: ${lastAiInput.subjectTitle}` : 'Scheduled AI Result');
      setDescription(
        `AI-generated content for subject: ${lastAiInput.subjectTitle || 'N/A'}.\nOriginal format: ${lastAiInput.desiredFormat || 'Unknown'}.`
      );
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));
      setNotifyByEmail(false);
      setAssociatedResultText(aiResult.result);
      setCurrentOriginalFormat(lastAiInput.desiredFormat || 'Unknown');
      setRepeatType('none');
      setSelectedWeeklyDays([]);

      setIsFormOpen(true);
      setEditingEvent(null);
      router.replace('/timetable', { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, aiResult, lastAiInput, router, isFormOpen, editingEvent]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast({ title: "Please Sign In", description: "You need to be signed in to manage your timetable.", variant: "destructive" });
      return;
    }
    if (!title || !date || !time) {
      toast({ title: "Missing Fields", description: "Title, date, and time are required.", variant: "destructive" });
      return;
    }
    if (isSubscribed && repeatType === 'weekly' && selectedWeeklyDays.length === 0) {
        toast({ title: "Missing Days", description: "Please select at least one day for weekly repeat.", variant: "destructive" });
        return;
    }

    let eventRepeatSetting: RepeatSetting | undefined;
    if (isSubscribed) {
        if (repeatType === 'daily') {
            eventRepeatSetting = { type: 'daily' };
        } else if (repeatType === 'weekly' && selectedWeeklyDays.length > 0) {
            eventRepeatSetting = { type: 'weekly', days: selectedWeeklyDays };
        } else {
            eventRepeatSetting = { type: 'none' };
        }
    } else {
        eventRepeatSetting = { type: 'none' };
    }

    const newEvent: TimetableEvent = {
      id: editingEvent ? editingEvent.id : crypto.randomUUID(),
      title,
      description,
      date, // Stored as "yyyy-MM-dd" string
      time,
      associatedResult: associatedResultText || undefined,
      originalFormat: currentOriginalFormat || (editingEvent ? editingEvent.originalFormat : 'Unknown'),
      notifyByEmail: isSubscribed ? notifyByEmail : false,
      repeat: eventRepeatSetting,
    };

    if (editingEvent) {
      setEvents(events.map(ev => ev.id === editingEvent.id ? newEvent : ev));
      toast({ title: "Event Updated", description: `"${newEvent.title}" has been updated.`, className: "bg-blue-500/10 border-blue-500" });
    } else {
      setEvents(prevEvents => [...prevEvents, newEvent].sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
      toast({ title: "Event Added", description: `"${newEvent.title}" has been added to your timetable.`, className: "bg-green-500/10 border-green-500" });
    }

    if (newEvent.notifyByEmail && auth.currentUser?.email && isSubscribed) {
        const formData = new FormData();
        formData.append('eventId', newEvent.id);
        formData.append('userEmail', auth.currentUser.email);
        formData.append('eventTitle', newEvent.title);
        formData.append('eventDateTime', `${newEvent.date}T${newEvent.time}`); // ISO 8601 format
        
        startScheduleEmailTransition(() => {
            runScheduleEmailAction(formData);
        });
    }

    resetForm();
  };

  const handleEdit = (event: TimetableEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date); // Expects "yyyy-MM-dd"
    setTime(event.time);
    setNotifyByEmail(isSubscribed ? (event.notifyByEmail || false) : false);
    setAssociatedResultText(event.associatedResult || '');
    setCurrentOriginalFormat(event.originalFormat || 'Unknown');
    setRepeatType(event.repeat?.type || 'none');
    setSelectedWeeklyDays(event.repeat?.type === 'weekly' ? event.repeat.days || [] : []);
    setIsFormOpen(true);
    setViewMode('list'); // Switch to list view when editing
  };

  const handleDelete = (id: string) => {
    setEvents(events.filter(ev => ev.id !== id));
    toast({ title: "Event Deleted", description: "The event has been removed from your timetable.", variant: "destructive" });
  };

  const todayFormatted = format(new Date(), 'yyyy-MM-dd');

  const handleViewResult = (resultText: string, originalFormat?: DesiredFormatType | string | null) => {
    setViewResultModalContent(resultText);
    setViewResultModalOriginalFormat(originalFormat || "Unknown");
    setIsViewResultModalOpen(true);
  };

  const isQAResultForModal = (text: string): boolean => {
    if (!text) return false;
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) && parsed.length > 0 &&
             typeof parsed[0] === 'object' && parsed[0] !== null &&
             'Question' in parsed[0] && 'Answer' in parsed[0];
    } catch (e) {
      return false;
    }
  };
  
  const handleWeeklyDayChange = (day: DayOfWeek, checked: boolean) => {
    setSelectedWeeklyDays(prev => 
        checked ? [...prev, day].sort((a,b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b)) : prev.filter(d => d !== day)
    );
  };

  const formatRepeatDisplay = (repeat?: RepeatSetting): string => {
    if (!repeat || repeat.type === 'none') return '';
    if (repeat.type === 'daily') return 'Repeats: Daily';
    if (repeat.type === 'weekly' && repeat.days && repeat.days.length > 0) {
        return `Repeats: Weekly on ${repeat.days.join(', ')}`;
    }
    return '';
  };
  
  const getEventDatesForCalendar = (event: TimetableEvent, month: Date): Date[] => {
    const eventBaseDate = parseISO(event.date);
    if (!isSameMonth(eventBaseDate, month) && event.repeat?.type === 'none') return [];

    const datesInMonth: Date[] = [];
    const startOfMonthDate = startOfDay(month);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    if (event.repeat?.type === 'none') {
      if (isSameMonth(eventBaseDate, month)) {
        datesInMonth.push(eventBaseDate);
      }
    } else if (event.repeat?.type === 'daily') {
      let currentDate = isSameMonth(eventBaseDate, month) ? eventBaseDate : startOfDay(new Date(month.getFullYear(), month.getMonth(), 1));
      if (currentDate < eventBaseDate) currentDate = eventBaseDate;

      while (currentDate <= endOfMonth) {
        if (currentDate >= eventBaseDate && isSameMonth(currentDate, month)) {
          datesInMonth.push(startOfDay(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }
    } else if (event.repeat?.type === 'weekly' && event.repeat.days && event.repeat.days.length > 0) {
      const repeatDaysNumbers = event.repeat.days.map(d => dayMapping[d]);
      let currentDate = isSameMonth(eventBaseDate, month) ? eventBaseDate : startOfDay(new Date(month.getFullYear(), month.getMonth(), 1));
       if (currentDate < eventBaseDate) currentDate = eventBaseDate;

      while (currentDate <= endOfMonth) {
        if (currentDate >= eventBaseDate && repeatDaysNumbers.includes(currentDate.getDay()) && isSameMonth(currentDate, month)) {
          datesInMonth.push(startOfDay(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }
    }
    return datesInMonth;
  };


  const calendarModifiers = {
    eventDay: events.reduce((acc, event) => {
        const eventDates = getEventDatesForCalendar(event, calendarMonth);
        return acc.concat(eventDates);
    }, [] as Date[]),
  };

  const calendarModifiersClassNames = {
    eventDay: 'event-day-highlight',
  };

  const filteredEventsForSelectedDate = events.filter(event => {
    if (!selectedCalendarDate) return true; // Show all if no date selected (should not happen if calendar is used)
    const selectedDayStart = startOfDay(selectedCalendarDate);
    const eventBaseDate = parseISO(event.date);

    if (event.repeat?.type === 'none') {
        return isEqual(startOfDay(eventBaseDate), selectedDayStart);
    }
    if (event.repeat?.type === 'daily') {
        return selectedDayStart >= startOfDay(eventBaseDate);
    }
    if (event.repeat?.type === 'weekly' && event.repeat.days && event.repeat.days.length > 0) {
        const repeatDaysNumbers = event.repeat.days.map(d => dayMapping[d]);
        return selectedDayStart >= startOfDay(eventBaseDate) && repeatDaysNumbers.includes(selectedDayStart.getDay());
    }
    return false;
  }).sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

  const renderEventCard = (event: TimetableEvent, index: number) => (
    <Card key={`${event.id}-${index}`} className="bg-secondary/50 border-border hover:border-primary/50 transition-colors">
        <CardHeader className="flex flex-row justify-between items-start pb-3">
        <div>
            <CardTitle className="text-lg text-primary">{event.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
            {format(parseISO(event.date), 'EEE, MMM d, yyyy')} at {format(parseISO(`1970-01-01T${event.time}`), 'p')}
            </p>
            {event.originalFormat && event.originalFormat !== "Unknown" && (
            <p className="text-xs text-accent flex items-center mt-1">
                <Info size={12} className="mr-1" /> AI Result Format: {event.originalFormat}
            </p>
            )}
            {event.repeat && event.repeat.type !== 'none' && isSubscribed && (
            <p className="text-xs text-purple-400 flex items-center mt-1">
                <Repeat size={12} className="mr-1" /> {formatRepeatDisplay(event.repeat)}
            </p>
            )}
        </div>
        <div className="flex space-x-1">
            {event.associatedResult && (
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleViewResult(event.associatedResult!, event.originalFormat)} className="text-sky-400 hover:text-sky-300">
                    <Eye className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>View Associated Result</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            )}
            <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(event)} className="text-blue-400 hover:text-blue-300">
                    <Edit3 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>Edit Event</p></TooltipContent>
            </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                </Button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>Delete Event</p></TooltipContent>
            </Tooltip>
            </TooltipProvider>
        </div>
        </CardHeader>
        {(event.description || (event.notifyByEmail && isSubscribed)) && (
        <CardContent className="pt-0 pb-3 space-y-1">
            {event.description && <p className="text-sm text-foreground whitespace-pre-wrap">{event.description}</p>}
            {event.notifyByEmail && isSubscribed && (
            <div className="flex items-center text-xs text-sky-400">
                <MailCheck className="mr-1.5 h-3.5 w-3.5" />
                <span>Conceptual email notification noted.</span>
            </div>
            )}
        </CardContent>
        )}
        {event.associatedResult && (
            <CardFooter className="text-xs text-muted-foreground bg-muted/30 py-2 px-4 rounded-b-md border-t">
            <span className="font-semibold mr-1 text-foreground">AI Result Associated:</span>
            {typeof event.associatedResult === 'string' && event.associatedResult.length > 50 ?
            event.associatedResult.substring(0,50) + "..." :
            (event.associatedResult || "")}
            </CardFooter>
        )}
    </Card>
  );


  return (
    <div className="container mx-auto py-8 px-4">
      <style jsx global>{`
        .event-day-highlight {
          background-color: hsl(var(--accent) / 0.2);
          color: hsl(var(--accent-foreground));
          border-radius: 0.375rem; /* Assuming rounded-md */
        }
        .rdp-day_selected.event-day-highlight, 
        .rdp-day_selected:focus.event-day-highlight, 
        .rdp-day_selected:active.event-day-highlight {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
        }
        .rdp-day_selected:hover.event-day-highlight {
            background-color: hsl(var(--primary) / 0.9);
        }
      `}</style>
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-primary/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <CalendarClock size={36} className="text-primary" />
            <CardTitle className="text-3xl font-bold text-primary">
              My Timetable
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            onClick={() => setViewMode('list')}
                            size="icon"
                            className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'border-primary text-primary'}
                            >
                            <List className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>List View</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={viewMode === 'calendar' ? 'default' : 'outline'}
                            onClick={() => setViewMode('calendar')}
                            size="icon"
                            className={viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'border-primary text-primary'}
                            >
                            <CalendarIcon className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Calendar View</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Button
                onClick={() => {
                if (isFormOpen && !editingEvent) { 
                    resetForm();
                } else if (isFormOpen && editingEvent) { 
                    setIsFormOpen(false); 
                }
                else { 
                    resetForm(); 
                    setIsFormOpen(true);
                    setViewMode('list'); // Ensure form opens in list view
                }
                }}
                variant="outline"
                className="border-accent text-accent hover:bg-accent/10 hover:text-accent"
            >
                <PlusCircle className="mr-2 h-4 w-4" /> {isFormOpen && !editingEvent ? "Close Form" : "Add New Event"}
            </Button>
          </div>
        </CardHeader>
        <CardDescription className="px-6 pb-2 text-sm text-muted-foreground">
            Organize your academic life. Add events, deadlines, and study sessions.
            Email notifications and event repeating are premium features.
        </CardDescription>

        {(isFormOpen || viewMode === 'list') && (
          <div className={viewMode === 'calendar' && !isFormOpen ? 'hidden' : ''}>
            {isFormOpen && (
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6 bg-secondary/30 p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-4">{editingEvent ? "Edit Event" : "Add New Event"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="event-title" className="text-foreground">Event Title</Label>
                    <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Physics Lecture" required />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="event-date" className="text-foreground">Date</Label>
                    <Input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={todayFormatted} required />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="event-time" className="text-foreground">Time</Label>
                    <Input id="event-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                    </div>
                    
                    <div className="space-y-2">
                    <Label htmlFor="event-repeat-type" className="text-foreground">Repeat</Label>
                    <Select
                        value={isSubscribed ? repeatType : 'none'}
                        onValueChange={(value: RepeatType) => {
                        if (isSubscribed) {
                            setRepeatType(value);
                            if (value !== 'weekly') setSelectedWeeklyDays([]);
                        } else if (value !== 'none') {
                            toast({ title: "Premium Feature", description: "Event repeating is a premium feature. Please subscribe to use this.", variant: "default" });
                        }
                        }}
                        disabled={!isSubscribed}
                    >
                        <SelectTrigger id="event-repeat-type" className={!isSubscribed ? 'opacity-70 cursor-not-allowed' : ''}>
                        <SelectValue placeholder="Select repeat type..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="none">Does not repeat</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                    </Select>
                    {!isSubscribed && (
                        <p className="text-xs text-muted-foreground">
                        Repeating events is a <Link href="/pricing" className="underline text-primary font-semibold">premium feature</Link>.
                        </p>
                    )}
                    </div>
                </div>

                {isSubscribed && repeatType === 'weekly' && (
                    <div className="space-y-3 pt-2">
                    <Label className="text-foreground">Repeat on (Weekly)</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                        {daysOfWeek.map(day => (
                        <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                            id={`repeat-day-${day}`}
                            checked={selectedWeeklyDays.includes(day)}
                            onCheckedChange={(checked) => handleWeeklyDayChange(day, checked as boolean)}
                            />
                            <Label htmlFor={`repeat-day-${day}`} className="text-sm font-normal text-foreground">{day}</Label>
                        </div>
                        ))}
                    </div>
                     {selectedWeeklyDays.length === 0 && <p className="text-xs text-destructive">Please select at least one day for weekly repeat.</p>}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="event-description" className="text-foreground">Description (Optional)</Label>
                    <Textarea id="event-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Chapter 5 review, meet study group" />
                </div>
                {associatedResultText && (
                    <div className="space-y-2">
                        <Label htmlFor="associated-result-preview" className="text-foreground">Associated AI Result (Preview) - Format: {currentOriginalFormat || "Unknown"}</Label>
                        <Textarea
                            id="associated-result-preview"
                            value={
                                (typeof associatedResultText === 'string' && associatedResultText.length > 200) ?
                                associatedResultText.substring(0,200) + "..." :
                                (associatedResultText || "")
                            }
                            readOnly
                            className="bg-muted/50 h-20"
                        />
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <TooltipProvider>
                    <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                        <div className={!isSubscribed ? 'cursor-not-allowed relative' : 'relative'}>
                            <Checkbox
                            id="notify-email"
                            checked={isSubscribed ? notifyByEmail : false}
                            onCheckedChange={(checked) => {
                                if (isSubscribed) {
                                setNotifyByEmail(checked as boolean);
                                }
                            }}
                            disabled={!isSubscribed || isSchedulingEmail}
                            aria-describedby={!isSubscribed ? "premium-feature-email-tt" : undefined}
                            />
                            {!isSubscribed && <div className="absolute inset-0" />}
                        </div>
                        </TooltipTrigger>
                        {!isSubscribed && (
                        <TooltipContent id="premium-feature-email-tt" side="bottom">
                            <p className="text-xs">Email notifications are a premium feature. <Link href="/pricing" className="underline text-primary font-semibold">Upgrade now!</Link></p>
                        </TooltipContent>
                        )}
                    </Tooltip>
                    </TooltipProvider>
                    <Label htmlFor="notify-email" className={`text-sm font-medium leading-none ${!isSubscribed ? 'opacity-50 cursor-not-allowed' : ''} text-foreground`}>
                    Notify by Email
                    </Label>
                </div>
                {isSubscribed && notifyByEmail && <p className="text-xs text-muted-foreground mt-1">A conceptual email notification will be logged for this event.</p>}
                {isSubscribed && repeatType !== 'none' && <p className="text-xs text-muted-foreground mt-1">Conceptual: This event would repeat {repeatType}{repeatType === 'weekly' && selectedWeeklyDays.length > 0 ? ` on ${selectedWeeklyDays.join(', ')}` : ''}. Actual repeat instances not shown.</p>}


                <div className="flex justify-end space-x-3">
                    <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSchedulingEmail}>
                    {isSchedulingEmail ? "Saving..." : (editingEvent ? "Update Event" : "Add Event")}
                    </Button>
                </div>
                </form>
            </CardContent>
            )}

            <CardContent className="mt-6">
            {!isLoggedIn ? (
                <p className="text-center text-muted-foreground py-8">Please sign in to view and manage your timetable.</p>
            ) : (viewMode === 'list' && events.length === 0 && !isFormOpen) ? (
                <div className="text-center py-8">
                <ListChecks size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your timetable is empty.</p>
                <p className="text-sm text-muted-foreground">Click "Add New Event" to get started.</p>
                </div>
            ) : viewMode === 'list' && (
                <div className="space-y-4">
                {events.map((event, index) => renderEventCard(event, index))}
                </div>
            )}
            </CardContent>
          </div>
        )}

        {viewMode === 'calendar' && !isFormOpen && (
            <CardContent className="mt-6">
                <div className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedCalendarDate}
                        onSelect={(date) => {
                            setSelectedCalendarDate(date);
                            if (date) setCalendarMonth(date); // Update month if a date is selected
                        }}
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                        className="rounded-md border bg-background"
                        modifiers={calendarModifiers}
                        modifiersClassNames={calendarModifiersClassNames}
                        disabled={!isLoggedIn}
                    />
                </div>
                {isLoggedIn && selectedCalendarDate && (
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold text-foreground mb-3">
                            Events for: {format(selectedCalendarDate, 'EEE, MMM d, yyyy')}
                        </h3>
                        {filteredEventsForSelectedDate.length > 0 ? (
                            <div className="space-y-4">
                                {filteredEventsForSelectedDate.map((event, index) => renderEventCard(event, index))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No events scheduled for this day.</p>
                        )}
                    </div>
                )}
                {!isLoggedIn && (
                     <p className="text-center text-muted-foreground py-8">Please sign in to view your timetable on the calendar.</p>
                )}
            </CardContent>
        )}


      </Card>

      <Dialog open={isViewResultModalOpen} onOpenChange={setIsViewResultModalOpen}>
        <DialogContent className="max-w-2xl min-h-[300px] max-h-[80vh] flex flex-col bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary">Scheduled AI Result</DialogTitle>
            <DialogDescription>
              Details of the AI result associated with this event.
              {viewResultModalOriginalFormat && viewResultModalOriginalFormat !== "Unknown" && (
                <span className="block mt-1 text-sm text-accent">Original Format: {viewResultModalOriginalFormat}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow w-full rounded-md border p-4 my-4 bg-background">
            {viewResultModalContent && (() => {
              if (viewResultModalOriginalFormat === 'Question Answering' && isQAResultForModal(viewResultModalContent)) {
                try {
                  const parsedResult = JSON.parse(viewResultModalContent) as QAItem[];
                  return (
                    <div>
                      {parsedResult.map((qa, index) => (
                        <div key={index} className="mb-8 pb-6 border-b border-border/50 last:border-b-0 last:pb-0 last:mb-0">
                          <p className="text-lg font-semibold text-primary mb-1">Question:</p>
                          <p className="text-foreground whitespace-pre-wrap">{String(qa.Question ?? 'N/A')}</p>
                          <p className="text-lg font-semibold text-accent mt-3 mb-1">Answer:</p>
                          <p className="text-foreground whitespace-pre-wrap">{String(qa.Answer ?? 'N/A')}</p>
                        </div>
                      ))}
                    </div>
                  );
                } catch (e) {
                  console.error("ViewResultModal: Error parsing Q&A JSON", e, "Problematic JSON (first 100 chars):", viewResultModalContent.substring(0,100) + (viewResultModalContent.length > 100 ? "..." : ""));
                  return <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{viewResultModalContent}</div>;
                }
              }
              return <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{viewResultModalContent}</div>;
            })()}
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    