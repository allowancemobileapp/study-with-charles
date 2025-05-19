
import { AssignmentForm } from "@/components/ai-helper/AssignmentForm";
import { SubscriptionCTA } from "@/components/SubscriptionCTA";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, CalendarDays, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <section className="mb-12">
        <AssignmentForm />
      </section>
      
      <SubscriptionCTA />

      <section className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="bg-card/70 backdrop-blur-sm border-primary/30 shadow-lg hover:shadow-primary/20 transition-shadow">
          <CardHeader className="flex-row items-center space-x-3 pb-2">
            <Lightbulb className="w-8 h-8 text-primary" />
            <CardTitle className="text-xl text-foreground">Smart Assistance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Leverage AI to understand complex topics, generate summaries, and get answers to your questions.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-sm border-accent/30 shadow-lg hover:shadow-accent/20 transition-shadow">
          <CardHeader className="flex-row items-center space-x-3 pb-2">
             <CalendarDays className="w-8 h-8 text-accent" />
            <CardTitle className="text-xl text-foreground">Effortless Scheduling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Organize your study schedule, set reminders for deadlines, and manage your academic tasks with ease.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-sm border-yellow-500/30 shadow-lg hover:shadow-yellow-500/20 transition-shadow">
          <CardHeader className="flex-row items-center space-x-3 pb-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            <CardTitle className="text-xl text-foreground">Boost Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Focus on learning while our tools help you manage the workload and stay on top of your game.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
