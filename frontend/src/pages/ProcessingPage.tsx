import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge } from '../components/ui';
import { Sparkles, Check, Clock, Image as ImageIcon, Zap, Mail } from 'lucide-react';

const processingSteps = [
  {
    id: 1,
    title: 'Analyzing Photos',
    description: 'AI is learning your facial features and expressions',
    icon: Sparkles,
    duration: 15,
  },
  {
    id: 2,
    title: 'Training Model',
    description: 'Creating your personalized AI model',
    icon: Zap,
    duration: 30,
  },
  {
    id: 3,
    title: 'Generating Headshots',
    description: 'AI is creating your professional headshots',
    icon: ImageIcon,
    duration: 40,
  },
  {
    id: 4,
    title: 'Finalizing',
    description: 'Applying finishing touches and organizing results',
    icon: Check,
    duration: 15,
  },
];

export default function ProcessingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(120); // minutes

  useEffect(() => {
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Navigate to batch view after completion
          setTimeout(() => navigate('/batches/1'), 1000);
          return 100;
        }
        return prev + 0.5;
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, [navigate]);

  useEffect(() => {
    // Update current step based on progress
    if (progress < 25) setCurrentStep(0);
    else if (progress < 50) setCurrentStep(1);
    else if (progress < 80) setCurrentStep(2);
    else setCurrentStep(3);

    // Update estimated time
    setEstimatedTime(Math.max(1, Math.round((100 - progress) * 1.2)));
  }, [progress]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="ai" className="mb-6 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              AI Processing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Creating Your Headshots
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Our AI is hard at work generating your professional headshots
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Clock className="w-5 h-5" />
              <span>Estimated time remaining: {estimatedTime} minutes</span>
            </div>
          </div>

          {/* Progress Bar */}
          <Card variant="default" className="p-8 mb-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-primary-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-600 transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Processing Steps */}
            <div className="space-y-4">
              {processingSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-primary-50 border-2 border-primary-300'
                        : isCompleted
                        ? 'bg-green-50 border-2 border-green-200'
                        : 'bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-primary-500 to-secondary-600 animate-pulse'
                          : isCompleted
                          ? 'bg-accent'
                          : 'bg-gray-300'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-6 h-6 text-white ${isActive ? 'animate-spin' : ''}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      {isActive && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-primary-600 font-medium">Processing...</span>
                        </div>
                      )}
                      {isCompleted && (
                        <Badge variant="success" size="sm" className="mt-2">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="default" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Email Notification</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We'll send you an email when your headshots are ready. You can safely close this page.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="default" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Processing Time</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Most batches complete in 1-2 hours, though it may take up to 3 hours during peak times.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* What Happens Next */}
          <Card variant="default" className="p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What Happens Next?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">AI Generation</h3>
                <p className="text-sm text-gray-600">
                  Our AI creates multiple professional headshots using your photos
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Quality Check</h3>
                <p className="text-sm text-gray-600">
                  We review and enhance each headshot for quality
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Ready to Download</h3>
                <p className="text-sm text-gray-600">
                  Browse, filter, and download your professional headshots
                </p>
              </div>
            </div>
          </Card>

          {/* Tips */}
          <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              Pro Tips While You Wait
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span>You'll receive 40-200 headshots depending on your plan</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Each headshot can be filtered by style template (LinkedIn, Corporate, Creative, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Download individual photos or all at once in high resolution</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span>All headshots include full commercial usage rights</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
