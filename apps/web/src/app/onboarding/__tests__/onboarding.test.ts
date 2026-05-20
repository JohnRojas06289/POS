describe('Onboarding — slugify business name', () => {
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30);
  }

  it('converts spaces to underscores', () => {
    expect(slugify('Arepas El Mono')).toBe('arepas_el_mono');
  });

  it('removes accents', () => {
    expect(slugify('Tiendita María')).toBe('tiendita_maria');
  });

  it('strips special characters', () => {
    expect(slugify('Mi Negocio & Co.')).toBe('mi_negocio_co');
  });

  it('truncates at 30 chars', () => {
    expect(slugify('a'.repeat(40))).toHaveLength(30);
  });

  it('collapses multiple underscores', () => {
    expect(slugify('foo   bar')).toBe('foo_bar');
  });
});

describe('Onboarding — form validation', () => {
  const emailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  it('accepts valid email', () => {
    expect(emailValid('admin@negocio.co')).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(emailValid('notanemail')).toBe(false);
    expect(emailValid('')).toBe(false);
    expect(emailValid('missing@')).toBe(false);
  });

  it('password requires at least 8 chars', () => {
    expect('short'.length >= 8).toBe(false);
    expect('longenough'.length >= 8).toBe(true);
  });

  it('schema name must be lowercase alphanumeric with underscores', () => {
    const valid = (s: string) => /^[a-z0-9_]+$/.test(s) && s.length >= 3;
    expect(valid('arepas_mono')).toBe(true);
    expect(valid('Mi-Schema!')).toBe(false);
    expect(valid('ab')).toBe(false);
  });
});
