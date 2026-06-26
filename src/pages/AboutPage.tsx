import { Target, Award, Users, TrendingUp, Quote } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

export function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <ImageWithFallback
            src="/assets/hero-about.jpg"
            alt="Oil refinery"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Fredviv Oil & Gas Limited</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Building trust through quality and excellence in petroleum product distribution
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src="/assets/about-team.jpg"
                  alt="Business team"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Fredviv Oil and Gas Limited was established with a clear vision: to become Nigeria's most trusted supplier of quality petroleum products. From our humble beginnings, we have grown into a leading player in the oil and gas industry.
              </p>
              <p className="text-gray-600 mb-4">
                Our journey has been marked by unwavering commitment to quality, customer satisfaction, and operational excellence. We have built a reputation for reliability and integrity that sets us apart in the competitive energy sector.
              </p>
              <p className="text-gray-600">
                Today, we serve thousands of customers across Nigeria, from individual consumers to large industrial clients, delivering petroleum products that power businesses and homes nationwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-gray-600">
                To provide high-quality petroleum products and exceptional service to our customers, while maintaining the highest standards of safety, integrity, and environmental responsibility. We aim to be the preferred partner for all energy needs across Nigeria.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-gray-600">
                To be recognized as West Africa's leading petroleum products supplier, known for innovation, reliability, and customer-centric solutions. We envision a future where clean, efficient energy is accessible to all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CEO Message */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="grid md:grid-cols-5 gap-0">
              {/* Left Column - CEO Image & Info */}
              <div className="md:col-span-2 bg-gray-50 p-8 md:p-12 flex flex-col items-center justify-center border-r border-gray-100">
                <div className="w-full max-w-xs">
                  <div className="relative mb-6">
                    <div className="aspect-square rounded-xl overflow-hidden shadow-xl">
                      <ImageWithFallback
                        src="/assets/about-ceo.png"
                        alt="CEO Portrait"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Agindotan Emmanuel</h3>
                    <p className="text-gray-500 text-sm mb-4">Chief Executive Officer</p>
                    <div className="w-24 h-px bg-primary mx-auto"></div>
                  </div>
                </div>
              </div>

              {/* Right Column - Message */}
              <div className="md:col-span-3 p-8 md:p-12 relative">
                {/* Subtle quote background */}
                <div className="absolute top-8 right-8 opacity-5">
                  <Quote className="w-24 h-24 text-primary" />
                </div>

                <div className="relative">
                  <div className="mb-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                      A Message from Our CEO
                    </h2>
                    <div className="w-16 h-1 bg-primary rounded-full"></div>
                  </div>

                  <div className="space-y-5 text-gray-700 leading-relaxed">
                    <p className="text-lg">
                      Agindotan Emmanuel is a dynamic entrepreneur in Nigeria's oil and gas industry, based in Delta State. As the founder of Fredvivoil and Gas, he has steadily built a reputation for delivering reliable, high-quality energy services while driving consistent business growth.
                    </p>
                    <p className="text-lg">
                      With over five years of hands-on experience, Emmanuel has positioned the company as an emerging force within the sector, guided by a clear vision for excellence and sustainability. His long-term goal is to establish Fredvivoil and Gas as a leading name in Nigeria's energy landscape.
                    </p>
                    <p className="text-lg">
                      Beyond business, he is a devoted family man who values balance, leadership, and long-term impact—both at home and in the marketplace.
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-gray-500 text-sm italic">
                      "Excellence is not an act, but a habit. We are committed to making it yours."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Quality Excellence</h3>
              <p className="text-gray-600">
                We never compromise on the quality of our products and services
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Customer Focus</h3>
              <p className="text-gray-600">
                Our customers' needs and satisfaction drive every decision we make
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Integrity</h3>
              <p className="text-gray-600">
                We operate with transparency, honesty, and ethical business practices
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Innovation</h3>
              <p className="text-gray-600">
                We continuously improve and adapt to meet evolving industry needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Credentials */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Industry Leadership</h2>
            <p className="text-green-100 max-w-2xl mx-auto">
              Our commitment to excellence is reflected in our industry credentials and certifications
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">15+</div>
              <div className="text-green-100">Years of Experience</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">5000+</div>
              <div className="text-green-100">Satisfied Customers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-green-100">Distribution Points</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">99.8%</div>
              <div className="text-green-100">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Excellence */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Operational Excellence</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">State-of-the-Art Facilities</h4>
                    <p className="text-gray-600">
                      Modern storage and distribution infrastructure meeting international safety standards
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Professional Team</h4>
                    <p className="text-gray-600">
                      Highly trained staff committed to safety and customer service excellence
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Efficient Logistics</h4>
                    <p className="text-gray-600">
                      Strategic distribution network ensuring timely delivery across Nigeria
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Quality Control</h4>
                    <p className="text-gray-600">
                      Rigorous testing and monitoring to guarantee product quality at every stage
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-xl">
              <ImageWithFallback
                src="/assets/about-pipeline.jpg"
                alt="Oil pipeline infrastructure"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}