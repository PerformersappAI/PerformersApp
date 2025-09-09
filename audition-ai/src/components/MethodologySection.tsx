
const MethodologySection = () => {
  const methods = [
    "Stanislavski", "Meisner", "Strasberg", "Uta Hagen"
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">
          Master Every{" "}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Acting Method
          </span>
        </h2>
        
        <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
          Our AI coach is trained in all major acting methodologies, 
          adapting to your preferred technique and artistic vision.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {methods.map((method, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="text-white font-semibold text-sm">{method}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MethodologySection;
