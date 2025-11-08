import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Clock, DollarSign } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section - Bento Grid Style */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Main Hero Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full mb-6 border border-primary-100">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-700">Trusted by 100,000+ professionals</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Professional AI Headshots
              <span className="block text-primary-500">in Minutes</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Get 40-200 studio-quality headshots for $29-59. No photographer needed.
              Perfect for LinkedIn, resumes, and professional profiles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/register"
                className="group px-8 py-4 text-lg font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                Create Your Headshots
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/pricing"
                className="px-8 py-4 text-lg font-semibold text-primary-600 bg-white border-2 border-primary-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
              >
                View Pricing
              </Link>
            </div>
            <p className="text-sm text-gray-500">No credit card required • 1-3 hour delivery • 100% satisfaction guaranteed</p>
          </div>

          {/* Bento Grid - Stats/Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">1-3 Hours</h3>
              <p className="text-gray-600">Lightning-fast delivery. Get your headshots the same day.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Save 90%</h3>
              <p className="text-gray-600">$29-59 vs $300+ for traditional photography sessions.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">8 Styles</h3>
              <p className="text-gray-600">From LinkedIn to Creative - optimized for every platform.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary-500 mb-2">100K+</div>
                <div className="text-gray-600">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary-500 mb-2">5M+</div>
                <div className="text-gray-600">Headshots Generated</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary-500 mb-2">4.9/5</div>
                <div className="text-gray-600">Average Rating</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary-500 mb-2">1-3h</div>
                <div className="text-gray-600">Average Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Modern Cards */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose HeadShotHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of professionals who trust AI for their headshots
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: '⚡',
                title: 'Lightning Fast',
                desc: 'Get your headshots in 1-3 hours, not days. Perfect for urgent needs.',
                gradient: 'from-yellow-400 to-orange-500'
              },
              {
                icon: '💰',
                title: 'Affordable',
                desc: 'Save 90% vs traditional photography. From $29 for 40 headshots.',
                gradient: 'from-green-400 to-emerald-500'
              },
              {
                icon: '🎨',
                title: '8 Style Templates',
                desc: 'From LinkedIn to Creative - optimized for every professional platform.',
                gradient: 'from-secondary-400 to-secondary-600'
              },
              {
                icon: '🤖',
                title: 'AI-Powered',
                desc: 'Advanced AI ensures studio-quality results every single time.',
                gradient: 'from-blue-400 to-cyan-500'
              },
              {
                icon: '🔒',
                title: 'Privacy First',
                desc: 'Your photos are encrypted and automatically deleted after 30 days.',
                gradient: 'from-red-400 to-rose-500'
              },
              {
                icon: '✨',
                title: 'Unlimited Revisions',
                desc: 'Not happy? We regenerate until you love your headshots.',
                gradient: 'from-secondary-500 to-secondary-700'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 group"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works - Interactive */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Simple, fast, and professional - in just 4 steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 md:gap-4 max-w-6xl mx-auto relative">
            {/* Connection Lines for Desktop */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" style={{ top: '32px' }} />

            {[
              { step: 1, title: 'Upload Photos', desc: 'Upload 12-20 selfies from different angles', icon: '📸' },
              { step: 2, title: 'Choose Plan', desc: 'Select your preferred plan and style templates', icon: '💳' },
              { step: 3, title: 'AI Magic', desc: 'AI generates studio-quality professional headshots', icon: '✨' },
              { step: 4, title: 'Download', desc: 'Receive and download all your headshots', icon: '⬇️' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all duration-300 group">
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      {item.step}
                    </div>
                    <div className="text-4xl mb-4 text-center">{item.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{item.title}</h3>
                    <p className="text-gray-600 text-center leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loved by Professionals
            </h2>
            <p className="text-xl text-gray-600">See what our customers are saying</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Marketing Director',
                text: 'I needed headshots for my LinkedIn profile urgently. HeadShotHub delivered amazing results in just 2 hours! Worth every penny.',
                rating: 5
              },
              {
                name: 'Michael Chen',
                role: 'Software Engineer',
                text: 'As someone camera-shy, this was perfect. No awkward photoshoot, just upload selfies and get professional results. Highly recommended!',
                rating: 5
              },
              {
                name: 'Emily Rodriguez',
                role: 'Real Estate Agent',
                text: 'The variety of styles is incredible. I use different headshots for different platforms. Saved me hundreds compared to a photographer.',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.name[0]}
                  </div>
                  <div className="ml-4">
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section - Conversion Optimized */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Transform Your
              <span className="block">Professional Image?</span>
            </h2>
            <p className="text-xl md:text-2xl text-primary-100 mb-10">
              Join 100,000+ professionals who trust AI for their headshots
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/register"
                className="group px-10 py-5 text-lg font-bold text-primary-600 bg-white rounded-xl hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                Get Started Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/pricing"
                className="px-10 py-5 text-lg font-bold text-white border-2 border-white rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                View Pricing
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>1-3 hour delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>Money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
