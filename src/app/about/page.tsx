
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Brain } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="w-full max-w-3xl mx-auto shadow-2xl border-primary/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <Image src="https://placehold.co/600x300.png" alt="Team working on computers" width={600} height={300} className="rounded-lg mb-6 mx-auto shadow-lg border-2 border-accent" data-ai-hint="team collaboration" />
          <CardTitle className="text-4xl font-bold text-primary">
            About PlanB: CyberGrade
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Your AI-powered academic co-pilot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-foreground leading-relaxed">
          <section>
            <h2 className="flex items-center text-2xl font-semibold text-primary mb-3">
              <Target className="mr-3 h-7 w-7" /> Our Mission
            </h2>
            <p>
              At PlanB: CyberGrade, our mission is to empower students by providing innovative AI-driven tools that simplify learning, enhance understanding, and improve academic organization. We believe that technology can bridge gaps in traditional education, offering personalized support to every student.
            </p>
          </section>

          <section>
            <h2 className="flex items-center text-2xl font-semibold text-accent mb-3">
              <Brain className="mr-3 h-7 w-7" /> What We Do
            </h2>
            <p>
              We leverage cutting-edge artificial intelligence to offer a suite of services designed to help students excel. From our AI Assignment Helper that demystifies complex subjects to our intuitive Timetable & Scheduling system that keeps you on track, PlanB: CyberGrade is built to be your ultimate study partner. Our platform is designed with a futuristic, user-friendly interface, making advanced academic assistance accessible and engaging.
            </p>
          </section>

          <section>
            <h2 className="flex items-center text-2xl font-semibold text-primary mb-3">
              <Users className="mr-3 h-7 w-7" /> Who We Are
            </h2>
            <p>
              We are a passionate team of educators, developers, and AI enthusiasts dedicated to revolutionizing the learning experience. We understand the challenges students face and are committed to building solutions that are not just effective but also inspiring. Our cyberpunk-themed platform reflects our belief in a future where technology and education seamlessly integrate.
            </p>
            <p className="mt-2">
              Join us on this journey to make schoolwork smarter, not harder.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
