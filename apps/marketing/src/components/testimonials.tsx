const testimonials = [
  {
    quote:
      'Alignia helped me focus on what matters and actually follow through. I feel calmer and more consistent.',
    author: 'Sarah M.',
    role: 'Product Manager',
    avatar: 'SM',
  },
  {
    quote:
      'We finally have one place for our family goals. It keeps us aligned and turns good intentions into action.',
    author: 'James K.',
    role: 'Father of 3',
    avatar: 'JK',
  },
  {
    quote:
      'I stopped feeling scattered. The weekly reviews and habits helped me build real momentum.',
    author: 'Emily R.',
    role: 'Entrepreneur',
    avatar: 'ER',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28">
      <div className="container">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Real progress, real stories
          </h2>
          <p className="text-lg text-muted-foreground">
            People use Alignia to feel clear, aligned, and proud of their growth.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="flex flex-col rounded-xl border bg-background p-6"
            >
              <blockquote className="flex-1 text-muted-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
