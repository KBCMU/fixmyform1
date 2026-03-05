import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProgrammingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 lg:px-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Programming
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
              Personalized workout programs tailored to your goals, fitness level, and schedule.
              Get custom routines that adapt as you progress.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Custom Workout Plans
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Our AI creates personalized workout programs based on your fitness goals,
                  experience level, available equipment, and time constraints.
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Goal-specific programming</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Progressive overload tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Automatic program adjustments</span>
                  </li>
                </ul>
              </div>
              <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <p className="text-gray-400 text-lg">Workout builder interface coming soon</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <p className="text-gray-400 text-lg">Progress tracking dashboard coming soon</p>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Track Your Progress
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Monitor your strength gains, volume increases, and program adherence.
                  See how your body adapts over time.
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Strength progression charts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Volume and intensity tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Workout history and analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Program Types */}
        <section className="py-24 px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
              Program Types
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Strength", description: "Build muscle and increase strength with progressive overload programs." },
                { title: "Hypertrophy", description: "Maximize muscle growth with volume-focused training protocols." },
                { title: "Endurance", description: "Improve cardiovascular fitness and muscular endurance." },
              ].map((program, index) => (
                <div key={index} className="p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{program.title}</h3>
                  <p className="text-gray-600">{program.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get your custom program
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Answer a few questions and get a personalized workout plan designed for you.
            </p>
            <button className="px-8 py-4 text-base font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
              Create program
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

