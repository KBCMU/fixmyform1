import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DietPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Diet Planning
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
              Custom meal plans and nutritional guidance to fuel your fitness journey.
              Get personalized recommendations based on your goals and preferences.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Personalized Meal Plans
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Our nutrition AI creates custom meal plans tailored to your caloric needs,
                  dietary restrictions, food preferences, and fitness goals.
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Macro and micronutrient tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Dietary preference support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Weekly meal prep suggestions</span>
                  </li>
                </ul>
              </div>
              <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <p className="text-gray-400 text-lg">Meal plan interface coming soon</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <p className="text-gray-400 text-lg">Nutrition dashboard coming soon</p>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Nutrition Analytics
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Track your daily nutrition intake, monitor progress toward your goals,
                  and get insights into your eating patterns.
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Calorie and macro tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Meal timing optimization</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Progress visualization</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Diet Types */}
        <section className="py-24 px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
              Supported Diet Types
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Weight Loss", description: "Calorie-controlled plans designed for sustainable fat loss." },
                { title: "Muscle Gain", description: "High-protein meal plans to support muscle growth and recovery." },
                { title: "Performance", description: "Nutrition strategies optimized for athletic performance." },
              ].map((diet, index) => (
                <div key={index} className="p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{diet.title}</h3>
                  <p className="text-gray-600">{diet.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Start your nutrition journey
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get a personalized meal plan designed for your goals and lifestyle.
            </p>
            <button className="px-8 py-4 text-base font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
              Get meal plan
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

