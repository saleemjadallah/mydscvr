import { Link } from 'react-router-dom';
import { Button, Card, Badge } from '../components/ui';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

const pricingPlans = [
  {
    name: 'Starter',
    price: 29,
    headshots: 40,
    description: 'Perfect for individuals getting started',
    features: [
      '40 AI headshots',
      '2 style templates',
      '1-3 hour delivery',
      'High-resolution downloads',
      'Commercial usage rights',
      'Basic editing',
    ],
    icon: Zap,
    color: 'from-blue-400 to-blue-600',
    popular: false,
  },
  {
    name: 'Professional',
    price: 39,
    headshots: 100,
    description: 'Most popular for professionals',
    features: [
      '100 AI headshots',
      '5 style templates',
      '1-2 hour priority delivery',
      'High-resolution downloads',
      'Commercial usage rights',
      'Advanced editing',
      'Background variety',
      'Email support',
    ],
    icon: Sparkles,
    color: 'from-secondary-400 to-secondary-600',
    popular: true,
  },
  {
    name: 'Premium',
    price: 59,
    headshots: 200,
    description: 'Maximum variety and options',
    features: [
      '200 AI headshots',
      '8 style templates (all)',
      '1 hour express delivery',
      'High-resolution downloads',
      'Commercial usage rights',
      'Premium editing',
      'Custom backgrounds',
      'Priority support',
      'Unlimited revisions',
    ],
    icon: Crown,
    color: 'from-amber-400 to-amber-600',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="ai" className="mb-6">
            <Sparkles className="w-4 h-4" />
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get professional AI headshots in minutes. All plans include commercial usage rights and satisfaction guarantee.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              <span>No subscription</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              <span>Pay once, use forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              <span>Money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card
                key={index}
                variant="pricing"
                isPopular={plan.popular}
                hover={true}
                className={`relative flex flex-col ${
                  plan.popular ? 'md:scale-105 md:shadow-2xl' : ''
                }`}
              >
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/session</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {plan.headshots} headshots • ${(plan.price / plan.headshots).toFixed(2)} per photo
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  size="lg"
                  className="w-full mb-8"
                  asChild
                >
                  <Link to="/register">
                    Get Started
                  </Link>
                </Button>

                {/* Features List */}
                <div className="space-y-4 flex-grow">
                  <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    What's included:
                  </p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-accent/10 rounded-full flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">
              Compare All Plans
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              See exactly what's included in each package
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Starter</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900 bg-primary-50 rounded-t-lg">
                      Professional
                      <Badge variant="popular" size="sm" className="ml-2">Popular</Badge>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['AI Headshots', '40', '100', '200'],
                    ['Style Templates', '2', '5', '8 (All)'],
                    ['Delivery Time', '1-3 hours', '1-2 hours', '1 hour'],
                    ['Resolution', 'High-res', 'High-res', 'High-res'],
                    ['Commercial Rights', true, true, true],
                    ['Advanced Editing', false, true, true],
                    ['Background Variety', false, true, true],
                    ['Custom Backgrounds', false, false, true],
                    ['Revisions', 'Basic', 'Advanced', 'Unlimited'],
                    ['Support', 'Standard', 'Email', 'Priority'],
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-4 px-4 font-medium text-gray-900">{row[0]}</td>
                      <td className="py-4 px-4 text-center text-gray-700">
                        {typeof row[1] === 'boolean' ? (
                          row[1] ? (
                            <Check className="w-5 h-5 text-accent mx-auto" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )
                        ) : (
                          row[1]
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-900 font-medium bg-primary-50">
                        {typeof row[2] === 'boolean' ? (
                          row[2] ? (
                            <Check className="w-5 h-5 text-accent mx-auto" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )
                        ) : (
                          row[2]
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-700">
                        {typeof row[3] === 'boolean' ? (
                          row[3] ? (
                            <Check className="w-5 h-5 text-accent mx-auto" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )
                        ) : (
                          row[3]
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              Everything you need to know about our pricing
            </p>

            <div className="space-y-6">
              {[
                {
                  q: 'Is this a subscription or one-time payment?',
                  a: 'All our plans are one-time payments. You pay once and get your headshots, with no recurring charges.',
                },
                {
                  q: 'Can I upgrade my plan later?',
                  a: 'Yes! If you need more headshots or templates, you can purchase an additional plan at any time.',
                },
                {
                  q: 'What if I\'m not satisfied with the results?',
                  a: 'We offer a 100% satisfaction guarantee. If you\'re not happy with your headshots, we\'ll regenerate them or provide a full refund.',
                },
                {
                  q: 'Do I own the commercial rights to my headshots?',
                  a: 'Yes! All plans include full commercial usage rights. You can use your headshots anywhere - LinkedIn, websites, marketing materials, etc.',
                },
                {
                  q: 'How long does delivery take?',
                  a: 'Delivery times vary by plan: Starter (1-3 hours), Professional (1-2 hours), Premium (1 hour). Most orders are completed faster than the maximum time.',
                },
              ].map((faq, idx) => (
                <Card key={idx} variant="default" className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.q}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              Join 100,000+ professionals who trust HeadShotHub
            </p>
            <Button variant="primary" size="lg" className="bg-white text-primary-600 hover:bg-gray-50" asChild>
              <Link to="/register">
                Create Your Headshots Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
