import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { Button, Card, Badge } from '../components/ui';
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Sparkles, Zap, Crown } from 'lucide-react';

interface UploadPageProps {
  user: User;
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    headshots: 40,
    templates: 2,
    icon: Zap,
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 39,
    headshots: 100,
    templates: 5,
    icon: Sparkles,
    color: 'from-secondary-400 to-secondary-600',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 59,
    headshots: 200,
    templates: 8,
    icon: Crown,
    color: 'from-amber-400 to-amber-600',
  },
];

export default function UploadPage({ user }: UploadPageProps) {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isTestUser = user?.email === 'test@headshotsaas.com';
  const allowSingleUpload =
    isTestUser || import.meta.env.VITE_ENABLE_SINGLE_UPLOAD === 'true';
  const minUploadCount = allowSingleUpload ? 1 : 12;
  const uploadRequirementText = isTestUser
    ? 'Upload 1 selfie to generate your test headshot'
    : allowSingleUpload
      ? 'Upload at least 1 selfie to get started (testing mode)'
      : 'Upload 12-20 selfies from different angles to get started';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    setSelectedFiles(prev => [...prev, ...files].slice(0, 20));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file =>
      file.type.startsWith('image/')
    );
    setSelectedFiles(prev => [...prev, ...files].slice(0, 20));
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (selectedFiles.length < minUploadCount) {
      alert(`Please upload at least ${minUploadCount} photo${minUploadCount !== 1 ? 's' : ''}`);
      return;
    }

    setIsUploading(true);
    // TODO: Implement actual upload logic
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/processing');
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Upload Your Photos
            </h1>
            <p className="text-xl text-gray-600">
              {uploadRequirementText}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <span className="font-semibold text-gray-900">Upload Photos</span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 ${isTestUser ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'} rounded-full flex items-center justify-center font-bold`}>
                  2
                </div>
                <span className={isTestUser ? 'font-semibold text-gray-900' : 'text-gray-500'}>
                  {isTestUser ? 'Plan Activated' : 'Select Plan'}
                </span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <span className="text-gray-500">Process</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Upload Area - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upload Zone */}
              <Card variant="default" className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Upload Your Selfies
                </h2>

                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                    isDragging
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  }`}
                >
                  <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Drop your photos here
                  </h3>
                  <p className="text-gray-600 mb-6">
                    or click to browse from your computer
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="primary" size="md" type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                      <ImageIcon className="w-5 h-5" />
                      Choose Photos
                    </Button>
                  </label>
                </div>

                {/* File Requirements */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-2">Photo Requirements:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>{isTestUser ? 'Upload 1 selfie (test account)' : allowSingleUpload ? 'Upload at least 1 selfie while testing' : 'Upload 12-20 selfies for best results'}</li>
                        <li>Vary angles, expressions, and lighting</li>
                        <li>Clear face visibility (no sunglasses or hats)</li>
                        <li>High quality images (min 500x500px)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Selected Files Grid */}
                {selectedFiles.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Selected Photos ({selectedFiles.length}/20)
                      </h3>
                      {selectedFiles.length >= minUploadCount && (
                        <Badge variant="success">
                          <Check className="w-4 h-4" />
                          Ready to process
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {selectedFiles.length < minUploadCount && (
                      <p className="mt-4 text-sm text-amber-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Upload at least {minUploadCount - selectedFiles.length} more photo{minUploadCount - selectedFiles.length !== 1 ? 's' : ''} to continue
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Plan Selection / Test Access - 1 column */}
            <div className="space-y-6">
              <Card variant="default" className="p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {isTestUser ? 'Test Account Access' : 'Select Your Plan'}
                </h2>

                {isTestUser ? (
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100 rounded-xl mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Professional plan unlocked</h3>
                    <p className="text-sm text-gray-600">
                      This demo account already has the Professional plan activated. No payment is required—just upload a selfie to try the workflow end to end.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((plan) => {
                      const Icon = plan.icon;
                      const isSelected = selectedPlan === plan.id;

                      return (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 shadow-lg'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                                {plan.popular && (
                                  <Badge variant="popular" size="sm">Popular</Badge>
                                )}
                              </div>
                              <p className="text-2xl font-bold text-gray-900 mb-1">
                                ${plan.price}
                              </p>
                              <p className="text-sm text-gray-600">
                                {plan.headshots} headshots • {plan.templates} templates
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-6 h-6 text-primary-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Order Summary */}
                {selectedPlanData && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-700">
                        <span>Plan</span>
                        <span className="font-semibold">
                          {selectedPlanData.name}
                          {isTestUser ? ' (Test Access)' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Headshots</span>
                        <span className="font-semibold">{selectedPlanData.headshots}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Templates</span>
                        <span className="font-semibold">{selectedPlanData.templates}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                        <span>Total</span>
                        <span>
                          {isTestUser ? '$0 (included in test account)' : `$${selectedPlanData.price}`}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleSubmit}
                      isLoading={isUploading}
                      disabled={selectedFiles.length < minUploadCount}
                    >
                      {!isUploading && (
                        <>
                          {isTestUser ? (
                            <>
                              Start Test Generation
                              <Sparkles className="w-5 h-5" />
                            </>
                          ) : (
                            <>
                              Continue to Payment
                              <Check className="w-5 h-5" />
                            </>
                          )}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      {isTestUser
                        ? 'Demo access active • No payment required'
                        : '100% satisfaction guaranteed • Secure payment'}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
