const testimonials = [
  {
    quote:
      'Alignia has completely transformed how I approach my goals. The AI insights are incredibly helpful for staying motivated.',
    author: 'Sarah M.',
    role: 'Product Manager',
    avatar: 'SM',
  },
  {
    quote:
      "Our family uses Alignia to track our shared goals. It's brought us closer together and keeps everyone accountable.",
    author: 'James K.',
    role: 'Father of 3',
    avatar: 'JK',
  },
  {
    quote:
      "The habit tracking with streaks is addictive in the best way. I've finally built consistent morning routines.",
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
            Loved by goal achievers
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our users have to say about their experience with Alignia.
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
