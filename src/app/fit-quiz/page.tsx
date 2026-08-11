import { FitQuiz } from '@/components/quiz/FitQuiz';

export const metadata = {
  title: 'Fit Quiz | MATTE.',
  description: 'Find your perfect fit with our interactive quiz.',
};

export default function FitQuizPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Find Your Fit.
          </h1>
          <p className="text-lg text-text-muted">
            Take our quick quiz to discover premium engineered pieces tailored to your exact preferences.
          </p>
        </div>
        
        <FitQuiz />
      </div>
    </div>
  );
}
