// Screen-reader announcements (aria-live) for step changes. Spanish UI copy.
export function announcementFor({ step, previousStep = null, offerTitle = '', offerCount = 0 }) {
  if (step === 'bubble' && offerTitle) return `Propuesta abierta: ${offerTitle}`;
  if (step === 'overworld' && previousStep === 'bubble') return 'Volviste a las burbujas';
  if (step === 'overworld') return `Estás en las propuestas: ${offerCount} burbujas para explorar.`;
  if (step === 'intro') return 'Comenzó la introducción. Podés saltarla con el botón "Saltar intro".';
  return '';
}
