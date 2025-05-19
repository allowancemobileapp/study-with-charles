
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Edit3, CalendarClock, ListChecks } from "lucide-react";
import { useAppStore } from '@/lib/store';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns'; // For date formatting
import { useToast } from '@/hooks/use-toast';

interface TimetableEvent {
  id: string;
  title: string;
  description: string;
  date: string; // Store as YYYY-MM-DD
  time: string; // Store as HH:MM
  associatedResult?: string; // Placeholder for AI result content or ID
}

export default function TimetablePage() {
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimetableEvent | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [associatedResultText, setAssociatedResultText] = useState('');

  const { aiResult, isLoggedIn } = useAppStore();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoggedIn) {
      const storedEvents = localStorage.getItem('timetableEvents');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
    } else {
      setEvents([]); // Clear events if not logged in
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && events.length > 0) {
        localStorage.setItem('timetableEvents', JSON.stringify(events));
    } else if (isLoggedIn && events.length === 0) {
        localStorage.removeItem('timetableEvents');
    }
  }, [events, isLoggedIn]);


  useEffect(() => {
    if (searchParams.get('action') === 'schedule_result' && aiResult?.result) {
      setIsFormOpen(true);
      setTitle("Review AI Result");
      setAssociatedResultText(aiResult.result.substring(0, 200) + "..."); // Preview of result
      // Clear AI result from store or mark as scheduled to prevent re-scheduling same item automatically
    }
  }, [searchParams, aiResult]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setAssociatedResultText('');
    setEditingEvent(null);
    setIsFormOpen(false);
  };

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

    const newEvent: TimetableEvent = {
      id: editingEvent ? editingEvent.id : crypto.randomUUID(),
      title,
      description,
      date,
      time,
      associatedResult: associatedResultText || undefined,
    };

    if (editingEvent) {
      setEvents(events.map(ev => ev.id === editingEvent.id ? newEvent : ev));
      toast({ title: "Event Updated", description: `"${newEvent.title}" has been updated.`, className: "bg-blue-500/10 border-blue-500" });
    } else {
      setEvents([...events, newEvent].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime() ));
      toast({ title: "Event Added", description: `"${newEvent.title}" has been added to your timetable.`, className: "bg-green-500/10 border-green-500" });
    }
    resetForm();
  };

  const handleEdit = (event: TimetableEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date);
    setTime(event.time);
    setAssociatedResultText(event.associatedResult || '');
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setEvents(events.filter(ev => ev.id !== id));
    toast({ title: "Event Deleted", description: "The event has been removed from your timetable.", variant: "destructive" });
  };
  
  const today = format(new Date(), 'yyyy-MM-dd');


  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-primary/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <CalendarClock size={36} className="text-primary" />
            <CardTitle className="text-3xl font-bold text-primary">
              My Timetable
            </CardTitle>
          </div>
          <Button onClick={() => { setIsFormOpen(!isFormOpen); setEditingEvent(null); if(isFormOpen) resetForm(); }} variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent">
            <PlusCircle className="mr-2 h-4 w-4" /> {isFormOpen ? "Close Form" : "Add New Event"}
          </Button>
        </CardHeader>

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
                  <Input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-time" className="text-foreground">Time</Label>
                  <Input id="event-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description" className="text-foreground">Description (Optional)</Label>
                <Textarea id="event-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Chapter 5 review, meet study group" />
              </div>
              {associatedResultText && (
                 <div className="space-y-2">
                    <Label htmlFor="associated-result" className="text-foreground">Associated Result (Preview)</Label>
                    <Textarea id="associated-result" value={associatedResultText} readOnly className="bg-muted/50 h-20" />
                 </div>
              )}
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingEvent ? "Update Event" : "Add Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        )}

        <CardContent className="mt-6">
          {!isLoggedIn ? (
            <p className="text-center text-muted-foreground py-8">Please sign in to view and manage your timetable.</p>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <ListChecks size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your timetable is empty.</p>
              <p className="text-sm text-muted-foreground">Click "Add New Event" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <Card key={event.id} className="bg-secondary/50 border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row justify-between items-start pb-3">
                    <div>
                      <CardTitle className="text-lg text-primary">{event.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.date + 'T' + event.time), 'EEE, MMM d, yyyy')} at {format(new Date(event.date + 'T' + event.time), 'p')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event)} className="text-blue-400 hover:text-blue-300">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {event.description && (
                    <CardContent className="pt-0 pb-3">
                      <p className="text-sm text-foreground">{event.description}</p>
                    </CardContent>
                  )}
                  {event.associatedResult && (
                     <CardFooter className="text-xs text-accent bg-accent/10 py-2 px-4 rounded-b-md">
                        <span className="font-semibold">AI Result Associated:</span> {event.associatedResult.substring(0,50)}...
                     </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
