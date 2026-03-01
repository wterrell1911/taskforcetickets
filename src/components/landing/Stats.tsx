'use client';

const stats = [
  {
    value: '$100',
    label: 'Flat Fee',
    description: 'Starting price, no hidden costs',
  },
  {
    value: '$1,530',
    label: 'Avg. Insurance Savings',
    description: 'Over 3 years',
  },
  {
    value: '0',
    label: 'Court Appearances',
    description: 'Required from you',
  },
  {
    value: '3 min',
    label: 'To Submit',
    description: 'Quick and easy process',
  },
];

export function Stats() {
  return (
    <section className="bg-[#1A1A1A] py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#FFD100]">
                {stat.value}
              </div>
              <div className="text-white font-medium mt-2">{stat.label}</div>
              <div className="text-[#4A4A4A] text-sm mt-1">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
