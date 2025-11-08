import { useEffect, useMemo, useState } from 'react';
import { User } from '@/types';
import { Button, Card, Badge } from '../components/ui';
import { Download, Grid3x3, LayoutList, Star, Heart, Check, Filter, Search, X } from 'lucide-react';

interface BatchViewPageProps {
  user: User;
}

interface TemplateOption {
  id: string;
  name: string;
}

interface HeadshotItem {
  id: number;
  url: string;
  template: string;
  isFavorite?: boolean;
  backdrop?: string;
}

const defaultTemplates: TemplateOption[] = [
  { id: 'all', name: 'All Templates' },
  { id: 'linkedin', name: 'LinkedIn Professional' },
  { id: 'corporate', name: 'Corporate' },
  { id: 'creative', name: 'Creative' },
  { id: 'casual', name: 'Smart Casual' },
  { id: 'executive', name: 'Executive' },
  { id: 'speaker', name: 'Speaker' },
  { id: 'resume', name: 'Resume' },
  { id: 'website', name: 'Website' },
];

// Mock data - in real app this would come from API
const defaultHeadshots: HeadshotItem[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  url: `https://picsum.photos/seed/headshot-${i + 1}/500/500`,
  template: defaultTemplates[Math.floor(Math.random() * (defaultTemplates.length - 1)) + 1].id,
  isFavorite: Math.random() > 0.8,
}));

const testTemplates: TemplateOption[] = [
  { id: 'all', name: 'All Templates' },
  { id: 'linkedin', name: 'LinkedIn Professional' },
  { id: 'executive', name: 'Executive Leadership' },
  { id: 'creative', name: 'Creative Profile' },
];

const testHeadshots: HeadshotItem[] = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=640&q=80',
    template: 'linkedin',
    backdrop: 'Soft studio gray gradient',
    isFavorite: true,
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=640&q=80',
    template: 'linkedin',
    backdrop: 'Modern office background',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=640&q=80',
    template: 'executive',
    backdrop: 'Premium dark gradient backdrop',
    isFavorite: true,
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=640&q=80',
    template: 'executive',
    backdrop: 'Corporate boardroom lighting',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=640&q=80',
    template: 'creative',
    backdrop: 'Warm textured studio lighting',
  },
];

export default function BatchViewPage({ user }: BatchViewPageProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHeadshots, setSelectedHeadshots] = useState<number[]>([]);

  const isTestUser = user?.email === 'test@headshotsaas.com';

  const { templates, headshots } = useMemo(() => {
    return isTestUser
      ? { templates: testTemplates, headshots: testHeadshots }
      : { templates: defaultTemplates, headshots: defaultHeadshots };
  }, [isTestUser]);

  const [favorites, setFavorites] = useState<number[]>(
    headshots.filter(h => h.isFavorite).map(h => h.id)
  );

  useEffect(() => {
    setSelectedTemplate('all');
    setSearchQuery('');
    setSelectedHeadshots([]);
    setFavorites(headshots.filter(h => h.isFavorite).map(h => h.id));
  }, [headshots]);

  const templateCounts = useMemo(() => {
    const counts: Record<string, number> = { all: headshots.length };
    headshots.forEach((headshot) => {
      counts[headshot.template] = (counts[headshot.template] || 0) + 1;
    });
    // Ensure every template id has at least 0
    templates.forEach((template) => {
      if (counts[template.id] === undefined) {
        counts[template.id] = 0;
      }
    });
    return counts;
  }, [headshots, templates]);

  const filteredHeadshots = headshots.filter(headshot => {
    const templateMatch = selectedTemplate === 'all' || headshot.template === selectedTemplate;
    const searchMatch = searchQuery === '' ||
      templates.find(t => t.id === headshot.template)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return templateMatch && searchMatch;
  });

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedHeadshots(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedHeadshots(filteredHeadshots.map(h => h.id));
  };

  const deselectAll = () => {
    setSelectedHeadshots([]);
  };

  const downloadSelected = () => {
    alert(`Downloading ${selectedHeadshots.length} headshot(s)`);
    // TODO: Implement actual download logic
  };

  const downloadAll = () => {
    alert(`Downloading all ${filteredHeadshots.length} headshot(s)`);
    // TODO: Implement actual download logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Headshots</h1>
                <p className="text-gray-600">
                  Browse and download your professional AI-generated headshots
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={downloadAll}
                >
                  <Download className="w-5 h-5" />
                  Download All ({filteredHeadshots.length})
                </Button>
                {selectedHeadshots.length > 0 && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={downloadSelected}
                  >
                    <Download className="w-5 h-5" />
                    Download Selected ({selectedHeadshots.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card variant="default" className="p-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {headshots.length}
                </div>
                <div className="text-sm text-gray-600">Total Headshots</div>
              </Card>
              <Card variant="default" className="p-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {templates.length - 1}
                </div>
                <div className="text-sm text-gray-600">Style Templates</div>
              </Card>
              <Card variant="default" className="p-4">
                <div className="text-2xl font-bold text-primary-600 mb-1">
                  {favorites.length}
                </div>
                <div className="text-sm text-gray-600">Favorited</div>
              </Card>
              <Card variant="default" className="p-4">
                <div className="text-2xl font-bold text-secondary-600 mb-1">
                  {selectedHeadshots.length}
                </div>
                <div className="text-sm text-gray-600">Selected</div>
              </Card>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar - Filters */}
            <div className="lg:col-span-1">
              <Card variant="default" className="p-6 sticky top-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search Templates
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Template Filters */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Style Templates
                  </label>
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        selectedTemplate === template.id
                          ? 'bg-primary-50 border-2 border-primary-500 text-primary-700 font-semibold'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{template.name}</span>
                        <Badge
                          variant={selectedTemplate === template.id ? 'info' : 'info'}
                          size="sm"
                          className={selectedTemplate === template.id ? 'bg-primary-600 text-white' : ''}
                        >
                          {templateCounts[template.id] ?? 0}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>

                {/* View Mode */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    View Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Grid3x3 className="w-5 h-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <LayoutList className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>

                {/* Selection Actions */}
                {selectedHeadshots.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAll}
                      className="w-full"
                    >
                      <X className="w-4 h-4" />
                      Clear Selection
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Gallery */}
            <div className="lg:col-span-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredHeadshots.length}</span> headshot(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                  >
                    <Check className="w-4 h-4" />
                    Select All
                  </Button>
                </div>
              </div>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredHeadshots.map((headshot) => (
                    <div
                      key={headshot.id}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                    >
                      <img
                        src={headshot.url}
                        alt={`Headshot ${headshot.id}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-white text-sm font-medium">
                                {templates.find(t => t.id === headshot.template)?.name}
                              </span>
                              {headshot.backdrop && (
                                <span className="block text-xs text-white/80 mt-1">
                                  {headshot.backdrop}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(headshot.id);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                  favorites.includes(headshot.id)
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                                }`}
                              >
                                <Heart
                                  className={`w-4 h-4 ${favorites.includes(headshot.id) ? 'fill-current' : ''}`}
                                />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`Downloading headshot ${headshot.id}`);
                                }}
                                className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Selection Checkbox */}
                      <div className="absolute top-3 left-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(headshot.id);
                          }}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            selectedHeadshots.includes(headshot.id)
                              ? 'bg-primary-600 border-primary-600'
                              : 'bg-white/80 backdrop-blur-sm border-white hover:bg-white'
                          }`}
                        >
                          {selectedHeadshots.includes(headshot.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>

                      {/* Favorite Star */}
                      {favorites.includes(headshot.id) && (
                        <div className="absolute top-3 right-3">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-white fill-current" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {filteredHeadshots.map((headshot) => (
                    <Card key={headshot.id} variant="default" className="p-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleSelect(headshot.id)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            selectedHeadshots.includes(headshot.id)
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-gray-300 hover:border-primary-500'
                          }`}
                        >
                          {selectedHeadshots.includes(headshot.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </button>

                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={headshot.url}
                            alt={`Headshot ${headshot.id}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Headshot #{headshot.id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {templates.find(t => t.id === headshot.template)?.name}
                          </p>
                          {headshot.backdrop && (
                            <p className="text-xs text-gray-500 mt-1">
                              {headshot.backdrop}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleFavorite(headshot.id)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              favorites.includes(headshot.id)
                                ? 'bg-red-50 text-red-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Heart
                              className={`w-5 h-5 ${favorites.includes(headshot.id) ? 'fill-current' : ''}`}
                            />
                          </button>
                          <Button variant="primary" size="sm">
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {filteredHeadshots.length === 0 && (
                <Card variant="default" className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No headshots found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search query
                  </p>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setSelectedTemplate('all');
                      setSearchQuery('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
