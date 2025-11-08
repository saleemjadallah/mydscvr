import { Link } from 'react-router-dom';
import { User } from '@/types';
import { Button, Card, Badge } from '../components/ui';
import { Plus, Image, Clock, Check, Eye, Download, Trash2, Calendar } from 'lucide-react';

interface DashboardPageProps {
  user: User;
}

// Mock batch data
const mockBatches = [
  {
    id: 1,
    name: 'Professional Headshots - January 2025',
    status: 'completed' as const,
    createdAt: '2025-01-15T10:30:00Z',
    completedAt: '2025-01-15T12:45:00Z',
    plan: 'Professional',
    totalHeadshots: 100,
    templates: 5,
    thumbnails: [
      'https://picsum.photos/seed/b1-1/200/200',
      'https://picsum.photos/seed/b1-2/200/200',
      'https://picsum.photos/seed/b1-3/200/200',
      'https://picsum.photos/seed/b1-4/200/200',
    ],
  },
  {
    id: 2,
    name: 'LinkedIn Profile Update',
    status: 'processing' as const,
    createdAt: '2025-01-16T14:20:00Z',
    completedAt: null,
    plan: 'Starter',
    totalHeadshots: 40,
    templates: 2,
    progress: 45,
    thumbnails: [],
  },
  {
    id: 3,
    name: 'Executive Portraits - Q4',
    status: 'completed' as const,
    createdAt: '2024-12-10T09:15:00Z',
    completedAt: '2024-12-10T11:30:00Z',
    plan: 'Premium',
    totalHeadshots: 200,
    templates: 8,
    thumbnails: [
      'https://picsum.photos/seed/b3-1/200/200',
      'https://picsum.photos/seed/b3-2/200/200',
      'https://picsum.photos/seed/b3-3/200/200',
      'https://picsum.photos/seed/b3-4/200/200',
    ],
  },
];

export default function DashboardPage({ user }: DashboardPageProps) {
  const completedBatches = mockBatches.filter(b => b.status === 'completed');
  const processingBatches = mockBatches.filter(b => b.status === 'processing');
  const totalHeadshots = completedBatches.reduce((sum, b) => sum + b.totalHeadshots, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-lg text-gray-600">
                Manage your AI headshot batches and downloads
              </p>
            </div>
            <Button variant="primary" size="lg" asChild>
              <Link to="/upload">
                <Plus className="w-5 h-5" />
                Create New Batch
              </Link>
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card variant="default" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <Badge variant="info" size="sm">Total</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {totalHeadshots}
              </div>
              <div className="text-sm text-gray-600">Headshots Generated</div>
            </Card>

            <Card variant="default" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <Badge variant="success" size="sm">Done</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {completedBatches.length}
              </div>
              <div className="text-sm text-gray-600">Completed Batches</div>
            </Card>

            <Card variant="default" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <Badge variant="processing" size="sm">Active</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {processingBatches.length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </Card>

            <Card variant="default" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <Badge variant="success" size="sm">Ready</Badge>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {completedBatches.length}
              </div>
              <div className="text-sm text-gray-600">Ready to Download</div>
            </Card>
          </div>

          {/* Processing Batches */}
          {processingBatches.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Currently Processing</h2>
              <div className="space-y-4">
                {processingBatches.map((batch) => (
                  <Card key={batch.id} variant="default" className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-600 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Clock className="w-10 h-10 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {batch.name}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(batch.createdAt).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span>{batch.plan} Plan</span>
                              <span>•</span>
                              <span>{batch.totalHeadshots} headshots</span>
                            </div>
                          </div>
                          <Badge variant="processing">Processing</Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Progress
                            </span>
                            <span className="text-sm font-bold text-primary-600">
                              {batch.progress}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-secondary-600 transition-all duration-500"
                              style={{ width: `${batch.progress}%` }}
                            />
                          </div>
                        </div>

                        <p className="text-sm text-gray-600">
                          Estimated time remaining: {Math.round((100 - (batch.progress || 0)) * 1.2)} minutes
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Batches */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Batches</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{completedBatches.length} completed</span>
              </div>
            </div>

            {completedBatches.length === 0 ? (
              <Card variant="default" className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No batches yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first batch to get started with AI headshots
                </p>
                <Button variant="primary" size="lg" asChild>
                  <Link to="/upload">
                    <Plus className="w-5 h-5" />
                    Create Your First Batch
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedBatches.map((batch) => (
                  <Card key={batch.id} variant="default" className="overflow-hidden group">
                    {/* Thumbnail Grid */}
                    <div className="grid grid-cols-2 gap-1 aspect-square bg-gray-100">
                      {batch.thumbnails.map((thumb, idx) => (
                        <div key={idx} className="relative overflow-hidden bg-gray-200">
                          <img
                            src={thumb}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">
                          {batch.name}
                        </h3>
                        <Badge variant="success" size="sm">
                          <Check className="w-3 h-3" />
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          <span>{batch.totalHeadshots} headshots</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="primary" size="sm" className="flex-1" asChild>
                          <Link to={`/batches/${batch.id}`}>
                            <Eye className="w-4 h-4" />
                            View Gallery
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alert('Download all from batch ' + batch.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alert('Delete batch ' + batch.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 p-8 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Need more professional headshots?
                </h3>
                <p className="text-gray-600">
                  Create a new batch and get 40-200 AI-generated headshots in just 1-3 hours
                </p>
              </div>
              <Button variant="primary" size="lg" asChild className="flex-shrink-0">
                <Link to="/upload">
                  <Plus className="w-5 h-5" />
                  Create New Batch
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
